require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const Vote = require("./models/vote");
const User = require("./models/user");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || "development";
const AUTH_SECRET = process.env.AUTH_SECRET;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const VOTING_DEADLINE_HOUR = 22;
const FRONTEND_ROOT_DIR = path.join(__dirname, "..", "frontend");
const FRONTEND_DIST_DIR = path.join(FRONTEND_ROOT_DIR, "dist");
const FRONTEND_DIR = fs.existsSync(FRONTEND_DIST_DIR) ? FRONTEND_DIST_DIR : FRONTEND_ROOT_DIR;
const API_ROUTE_PREFIXES = ["/auth", "/vote", "/count", "/analytics", "/all", "/health"];

class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function assertRequiredConfiguration() {
  if (!MONGO_URI) {
    throw new AppError(500, "MONGO_URI is missing. Add it to the environment before starting the backend.");
  }

  if (!AUTH_SECRET || AUTH_SECRET === "change-me-before-production") {
    throw new AppError(500, "AUTH_SECRET must be set to a strong secret before deployment.");
  }
}

function buildCorsOptions() {
  if (ALLOWED_ORIGINS.length === 0) {
    return { origin: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(403, "Origin is not allowed by CORS."));
    }
  };
}

app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_DIR));

function createPasswordCredentials(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return {
    salt,
    hash
  };
}

function comparePassword(password, storedHash, storedSalt) {
  const computedHash = crypto.scryptSync(password, storedSalt, 64).toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

function toBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function createAuthToken(user) {
  const payload = {
    userId: user.userId,
    name: user.name,
    email: user.email
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifyAuthToken(token) {
  if (!token || typeof token !== "string") {
    throw new AppError(401, "Authentication token is missing.");
  }

  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    throw new AppError(401, "Authentication token is invalid.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  if (providedSignature !== expectedSignature) {
    throw new AppError(401, "Authentication token is invalid.");
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch (error) {
    throw new AppError(401, "Authentication token is invalid.");
  }
}

function extractBearerToken(req) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Authorization header is required.");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

function authenticateRequest(req, res, next) {
  try {
    const token = extractBearerToken(req);
    req.user = verifyAuthToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

function validateUserPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length === 0) {
    return { valid: false, message: "Request body is missing or invalid." };
  }

  const { userId, name, email, password } = body;

  if (typeof userId !== "string" || !userId.trim()) {
    return { valid: false, message: "userId is required." };
  }

  if (typeof name !== "string" || !name.trim()) {
    return { valid: false, message: "name is required." };
  }

  if (typeof email !== "string" || !email.trim()) {
    return { valid: false, message: "email is required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { valid: false, message: "email must be valid." };
  }

  if (typeof password !== "string" || password.length < 6) {
    return { valid: false, message: "password must be at least 6 characters long." };
  }

  return {
    valid: true,
    data: {
      userId: userId.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    }
  };
}

function validateLoginPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length === 0) {
    return { valid: false, message: "Request body is missing or invalid." };
  }

  const { email, password } = body;

  if (typeof email !== "string" || !email.trim()) {
    return { valid: false, message: "email is required." };
  }

  if (typeof password !== "string" || !password.trim()) {
    return { valid: false, message: "password is required." };
  }

  return {
    valid: true,
    data: {
      email: email.trim().toLowerCase(),
      password
    }
  };
}

function validateVotePayload(body, authenticatedUser) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length === 0) {
    return { valid: false, message: "Request body is missing or invalid." };
  }

  const { date, status } = body;

  if (!authenticatedUser?.userId || !authenticatedUser?.name) {
    return { valid: false, message: "Authenticated user information is missing." };
  }

  if (typeof date !== "string" || !date.trim()) {
    return { valid: false, message: "date is required." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return { valid: false, message: "date must be in YYYY-MM-DD format." };
  }

  if (status !== "yes" && status !== "no") {
    return { valid: false, message: 'status must be either "yes" or "no".' };
  }

  return {
    valid: true,
    data: {
      userId: authenticatedUser.userId,
      name: authenticatedUser.name,
      date: date.trim(),
      status
    }
  };
}

function validateCountDate(date) {
  if (typeof date !== "string" || !date.trim()) {
    return { valid: false, message: "Date is required." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return { valid: false, message: "Date must be in YYYY-MM-DD format." };
  }

  return { valid: true, date: date.trim() };
}

function isVotingClosed(now = new Date()) {
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return currentHour > VOTING_DEADLINE_HOUR ||
    (currentHour === VOTING_DEADLINE_HOUR && currentMinute > 0);
}

function assertVotingWindowOpen() {
  if (isVotingClosed()) {
    throw new AppError(403, "Voting is closed after 10:00 PM server time.");
  }
}

function normalizeMongoError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return new AppError(400, "Malformed JSON request body.");
  }

  if (error?.name === "ValidationError") {
    const messages = Object.values(error.errors || {}).map((item) => item.message);
    return new AppError(400, messages[0] || "Validation failed.");
  }

  if (error?.name === "CastError") {
    return new AppError(400, `Invalid value for ${error.path}.`);
  }

  if (error?.code === 11000) {
    if (error?.keyPattern?.email) {
      return new AppError(409, "An account with this email already exists.");
    }

    if (error?.keyPattern?.userId) {
      return new AppError(409, "This user ID is already registered.");
    }

    return new AppError(409, "A vote already exists for this user and date.");
  }

  if (error instanceof mongoose.Error) {
    return new AppError(500, "Database operation failed.");
  }

  return new AppError(500, "Internal server error.");
}

function publicUser(user) {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email
  };
}

async function registerUser(userData) {
  const credentials = createPasswordCredentials(userData.password);

  const user = new User({
    userId: userData.userId,
    name: userData.name,
    email: userData.email,
    passwordHash: credentials.hash,
    passwordSalt: credentials.salt
  });

  await user.save();

  return {
    message: "Account created successfully.",
    token: createAuthToken(user),
    user: publicUser(user)
  };
}

async function loginUser(loginData) {
  const user = await User.findOne({ email: loginData.email });

  if (!user || !comparePassword(loginData.password, user.passwordHash, user.passwordSalt)) {
    throw new AppError(401, "Invalid email or password.");
  }

  return {
    message: "Login successful.",
    token: createAuthToken(user),
    user: publicUser(user)
  };
}

async function saveOrUpdateVote(voteData) {
  const existingVote = await Vote.findOne({ userId: voteData.userId, date: voteData.date });

  if (existingVote) {
    existingVote.name = voteData.name;
    existingVote.status = voteData.status;
    await existingVote.save();
    return { message: "Vote updated" };
  }

  const newVote = new Vote(voteData);
  await newVote.save();
  return { message: "Vote created" };
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: NODE_ENV,
    mongoState: mongoose.connection.readyState
  });
});

app.post("/auth/signup", async (req, res, next) => {
  try {
    const validation = validateUserPayload(req.body);

    if (!validation.valid) {
      throw new AppError(400, validation.message);
    }

    const result = await registerUser(validation.data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const validation = validateLoginPayload(req.body);

    if (!validation.valid) {
      throw new AppError(400, validation.message);
    }

    const result = await loginUser(validation.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/auth/me", authenticateRequest, async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      throw new AppError(401, "Authenticated user was not found.");
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/vote", authenticateRequest, async (req, res, next) => {
  try {
    const validation = validateVotePayload(req.body, req.user);

    if (!validation.valid) {
      throw new AppError(400, validation.message);
    }

    assertVotingWindowOpen();

    const result = await saveOrUpdateVote(validation.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/count/:date", async (req, res, next) => {
  try {
    const validation = validateCountDate(req.params.date);

    if (!validation.valid) {
      throw new AppError(400, validation.message);
    }

    const yesCount = await Vote.countDocuments({ date: validation.date, status: "yes" });
    const noCount = await Vote.countDocuments({ date: validation.date, status: "no" });

    res.json({
      date: validation.date,
      yes: yesCount,
      no: noCount,
      total: yesCount + noCount
    });
  } catch (error) {
    next(error);
  }
});

app.get("/analytics", async (req, res, next) => {
  try {
    const analytics = await Vote.aggregate([
      {
        $group: {
          _id: "$date",
          yes: {
            $sum: {
              $cond: [{ $eq: ["$status", "yes"] }, 1, 0]
            }
          },
          no: {
            $sum: {
              $cond: [{ $eq: ["$status", "no"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          yes: 1,
          no: 1
        }
      }
    ]);

    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

app.get("/all", authenticateRequest, async (req, res, next) => {
  try {
    const votes = await Vote.find().sort({ date: 1, userId: 1 });
    res.json(votes);
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get(["/login", "/app"], (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.use((req, res, next) => {
  if (API_ROUTE_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    next();
    return;
  }

  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((error, req, res, next) => {
  const normalizedError = normalizeMongoError(error);

  if (!normalizedError.isOperational) {
    console.error("Unexpected error:", error);
  }

  res.status(normalizedError.statusCode || 500).json({
    error: normalizedError.message
  });
});

async function startServer() {
  try {
    assertRequiredConfiguration();
    await mongoose.connect(MONGO_URI, { dbName: "MessVote" });
    console.log("MongoDB Connected to MessVote");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const normalizedError = normalizeMongoError(error);
    console.error("Failed to start server:", normalizedError.message);
    process.exit(1);
  }
}

startServer();
