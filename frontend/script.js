const API_BASE_URL =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:5000";

const STORAGE_KEY = "prepwise-session";
const LOGIN_PATH = "/login";
const APP_PATH = "/app";

let currentUser = null;
let currentToken = null;
let authMode = "login";

function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error("The server returned an invalid response.");
  }
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function resetClientSessionState() {
  clearSession();
  currentUser = null;
  currentToken = null;
}

function togglePasswordVisibility(fieldId, button) {
  const input = document.getElementById(fieldId);

  if (!input) {
    return;
  }

  const shouldShow = input.type === "password";
  input.type = shouldShow ? "text" : "password";

  if (button) {
    const icon = button.querySelector(".eye-icon");

    if (icon) {
      icon.innerText = shouldShow ? "visibility" : "visibility_off";
    }

    button.classList.toggle("is-visible", shouldShow);
    button.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
  }
}

function redirectTo(path) {
  if (window.location.pathname !== path) {
    window.location.assign(path);
  }
}

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}Error`);

  if (input) {
    input.classList.toggle("invalid", Boolean(message));
  }

  if (error) {
    error.innerText = message || "";
  }
}

function setStatusError(message) {
  const statusGroup = document.getElementById("statusGroup");
  const error = document.getElementById("statusError");

  if (statusGroup) {
    statusGroup.classList.toggle("invalid", Boolean(message));
  }

  if (error) {
    error.innerText = message || "";
  }
}

function clearAuthErrors() {
  [
    "loginEmail",
    "loginPassword",
    "signupUserId",
    "signupName",
    "signupEmail",
    "signupPassword"
  ].forEach((fieldId) => setFieldError(fieldId, ""));
}

function clearVoteErrors() {
  setFieldError("date", "");
  setStatusError("");
}

function clearCountErrors() {
  setFieldError("countDate", "");
}

function validateLoginForm() {
  clearAuthErrors();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  let isValid = true;

  if (!email) {
    setFieldError("loginEmail", "Email is required.");
    isValid = false;
  }

  if (!password) {
    setFieldError("loginPassword", "Password is required.");
    isValid = false;
  }

  return isValid;
}

function validateSignupForm() {
  clearAuthErrors();

  const userId = document.getElementById("signupUserId").value.trim();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  let isValid = true;

  if (!userId) {
    setFieldError("signupUserId", "User ID is required.");
    isValid = false;
  }

  if (!name || name.length < 3) {
    setFieldError("signupName", "Enter a valid full name.");
    isValid = false;
  }

  if (!email) {
    setFieldError("signupEmail", "Email is required.");
    isValid = false;
  }

  if (!password || password.length < 6) {
    setFieldError("signupPassword", "Password must be at least 6 characters.");
    isValid = false;
  }

  return isValid;
}

function validateVoteForm() {
  clearVoteErrors();

  const date = document.getElementById("date").value;
  const statusNode = document.querySelector('input[name="status"]:checked');
  let isValid = true;

  if (!date) {
    setFieldError("date", "Please select a date.");
    isValid = false;
  }

  if (!statusNode) {
    setStatusError("Please choose a meal status.");
    isValid = false;
  }

  return isValid;
}

function validateCountForm() {
  clearCountErrors();
  const countDate = document.getElementById("countDate").value;

  if (!countDate) {
    setFieldError("countDate", "Please select a reporting date.");
    return false;
  }

  return true;
}

function showToast(elementId, message, type) {
  const resultDiv = document.getElementById(elementId);

  if (!resultDiv) {
    return;
  }

  resultDiv.innerText = message;
  resultDiv.className = `result-toast show ${type}`;

  setTimeout(() => {
    resultDiv.classList.remove("show");
  }, 5000);
}

function switchAuthMode(mode) {
  authMode = mode;

  document.getElementById("loginTab").classList.toggle("active", mode === "login");
  document.getElementById("signupTab").classList.toggle("active", mode === "signup");
  document.getElementById("loginForm").classList.toggle("hidden", mode !== "login");
  document.getElementById("signupForm").classList.toggle("hidden", mode !== "signup");
}

function updateSnapshot(data) {
  const liveDate = document.getElementById("liveDate");
  const liveYes = document.getElementById("liveYes");
  const liveNo = document.getElementById("liveNo");
  const liveTotal = document.getElementById("liveTotal");

  if (liveDate) {
    liveDate.innerText = data.date || "Not loaded";
  }

  if (liveYes) {
    liveYes.innerText = String(data.yes ?? 0);
  }

  if (liveNo) {
    liveNo.innerText = String(data.no ?? 0);
  }

  if (liveTotal) {
    liveTotal.innerText = String(data.total ?? 0);
  }
}

function renderSession(user, token) {
  currentUser = user;
  currentToken = token;

  const isAuthenticated = Boolean(user && token);
  const onLoginPage = window.location.pathname === LOGIN_PATH;
  const onAppPage = window.location.pathname === APP_PATH;

  document.getElementById("authStatus").innerText = isAuthenticated
    ? `Signed in as ${user.name}`
    : "Not signed in";
  document.getElementById("logoutBtn").classList.toggle("hidden", !isAuthenticated);
  document.getElementById("authWorkspace").classList.toggle("hidden", isAuthenticated && onAppPage);
  document.getElementById("appPanel").classList.toggle("hidden", !(isAuthenticated && onAppPage));

  document.getElementById("accountUserId").innerText = isAuthenticated ? user.userId : "Not signed in";
  document.getElementById("accountName").innerText = isAuthenticated ? user.name : "-";
  document.getElementById("accountEmail").innerText = isAuthenticated ? user.email : "-";
  document.getElementById("voteUserId").innerText = isAuthenticated ? user.userId : "-";
  document.getElementById("voteName").innerText = isAuthenticated ? user.name : "-";

  if (isAuthenticated && onLoginPage) {
    redirectTo(APP_PATH);
    return;
  }

  if (!isAuthenticated && onAppPage) {
    redirectTo(LOGIN_PATH);
  }
}

let activeRequests = 0;
let globalLoaderInterval;

function showGlobalLoader() {
  activeRequests++;
  let loader = document.getElementById("global-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "global-loader";
    Object.assign(loader.style, {
      position: "fixed",
      top: "0",
      left: "0",
      height: "4px",
      background: "linear-gradient(90deg, var(--accent), var(--teal))",
      zIndex: "9999",
      transition: "width 0.4s ease, opacity 0.4s ease",
      width: "0%",
      opacity: "1",
      boxShadow: "0 0 10px rgba(29, 110, 105, 0.5)",
      pointerEvents: "none"
    });
    document.body.appendChild(loader);
  }
  
  if (activeRequests === 1) {
    loader.style.opacity = "1";
    loader.style.width = "20%";
    clearInterval(globalLoaderInterval);
    globalLoaderInterval = setInterval(() => {
      let currentWidth = parseFloat(loader.style.width);
      if (currentWidth < 90) {
        loader.style.width = currentWidth + (95 - currentWidth) * 0.05 + "%";
      }
    }, 200);
  }
}

function hideGlobalLoader() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    let loader = document.getElementById("global-loader");
    if (loader) {
      clearInterval(globalLoaderInterval);
      loader.style.width = "100%";
      setTimeout(() => {
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.style.width = "0%";
        }, 400);
      }, 300);
    }
  }
}

async function requestJson(path, options = {}) {
  showGlobalLoader();
  try {
    const response = await fetch(getApiUrl(path), options);
    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    return data;
  } finally {
    hideGlobalLoader();
  }
}

async function handleSignup(event) {
  event.preventDefault();

  if (!validateSignupForm()) {
    showToast("signupResult", "Please fix the highlighted fields.", "error");
    return;
  }

  const button = document.getElementById("signupBtn");
  const originalText = button.innerHTML;
  button.innerHTML = '<div class="spinner"></div> Creating...';
  button.disabled = true;

  try {
    const result = await requestJson("/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: document.getElementById("signupUserId").value.trim(),
        name: document.getElementById("signupName").value.trim(),
        email: document.getElementById("signupEmail").value.trim(),
        password: document.getElementById("signupPassword").value
      })
    });

    saveSession({ token: result.token, user: result.user });
    renderSession(result.user, result.token);
    document.getElementById("signupForm").reset();
    showToast("signupResult", result.message, "success");
    redirectTo(APP_PATH);
  } catch (error) {
    showToast("signupResult", error.message, "error");
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

async function handleLogin(event) {
  event.preventDefault();

  if (!validateLoginForm()) {
    showToast("loginResult", "Please fix the highlighted fields.", "error");
    return;
  }

  const button = document.getElementById("loginBtn");
  const originalText = button.innerHTML;
  button.innerHTML = '<div class="spinner"></div> Logging in...';
  button.disabled = true;

  try {
    const result = await requestJson("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value
      })
    });

    saveSession({ token: result.token, user: result.user });
    renderSession(result.user, result.token);
    document.getElementById("loginForm").reset();
    showToast("loginResult", result.message, "success");
    redirectTo(APP_PATH);
  } catch (error) {
    showToast("loginResult", error.message, "error");
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

function logoutUser() {
  resetClientSessionState();
  renderSession(null, null);
  document.querySelectorAll('input[name="status"]').forEach((input) => {
    input.checked = false;
  });
  redirectTo(LOGIN_PATH);
}

async function restoreSession() {
  if (window.location.pathname === LOGIN_PATH) {
    resetClientSessionState();
    renderSession(null, null);
    return;
  }

  const session = getSession();

  if (!session?.token || !session?.user) {
    renderSession(null, null);
    return;
  }

  const authStatus = document.getElementById("authStatus");
  if (authStatus) {
    authStatus.innerHTML = '<span class="spinner" style="border-width: 2px; border-color: rgba(19, 33, 45, 0.2) rgba(19, 33, 45, 0.2) var(--ink) rgba(19, 33, 45, 0.2); display: inline-block; vertical-align: middle; width: 14px; height: 14px; margin-right: 6px;"></span> Restoring session...';
  }

  try {
    const result = await requestJson("/auth/me", {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });

    saveSession({ token: session.token, user: result.user });
    renderSession(result.user, session.token);
  } catch (error) {
    resetClientSessionState();
    renderSession(null, null);
    if (window.location.pathname === APP_PATH) {
      redirectTo(LOGIN_PATH);
    }
  }
}

async function submitVote() {
  if (!currentToken || !currentUser) {
    showToast("result", "Please log in before submitting a vote.", "error");
    return;
  }

  if (!validateVoteForm()) {
    showToast("result", "Please fix the highlighted fields.", "error");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<div class="spinner"></div> Submitting...';
  submitBtn.disabled = true;

  try {
    const result = await requestJson("/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        date: document.getElementById("date").value,
        status: document.querySelector('input[name="status"]:checked')?.value || null
      })
    });

    clearVoteErrors();
    document.querySelectorAll('input[name="status"]').forEach((input) => {
      input.checked = false;
    });
    showToast("result", result.message, "success");
  } catch (error) {
    showToast("result", error.message, "error");
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

async function getCount() {
  if (!validateCountForm()) {
    showToast("countResult", "Please choose a reporting date.", "error");
    return;
  }

  const countBtn = document.getElementById("countBtn");
  const originalText = countBtn.innerHTML;
  countBtn.innerHTML = '<div class="spinner"></div> Loading...';
  countBtn.disabled = true;

  try {
    const date = document.getElementById("countDate").value;
    const result = await requestJson(`/count/${date}`);
    updateSnapshot(result);
    showToast("countResult", `Yes: ${result.yes} | No: ${result.no} | Total: ${result.total}`, "success");
  } catch (error) {
    showToast("countResult", error.message, "error");
  } finally {
    countBtn.innerHTML = originalText;
    countBtn.disabled = false;
  }
}

function initializeDates() {
  const today = new Date().toISOString().split("T")[0];
  const voteDateInput = document.getElementById("date");
  const countDateInput = document.getElementById("countDate");

  if (voteDateInput && !voteDateInput.value) {
    voteDateInput.value = today;
  }

  if (countDateInput && !countDateInput.value) {
    countDateInput.value = today;
    updateSnapshot({ date: today, yes: 0, no: 0, total: 0 });
  }
}

function attachFieldListeners() {
  [
    "loginEmail",
    "loginPassword",
    "signupUserId",
    "signupName",
    "signupEmail",
    "signupPassword",
    "date",
    "countDate"
  ].forEach((fieldId) => {
    const element = document.getElementById(fieldId);

    if (!element) {
      return;
    }

    element.addEventListener("input", () => setFieldError(fieldId, ""));
    element.addEventListener("change", () => setFieldError(fieldId, ""));
  });

  document.querySelectorAll('input[name="status"]').forEach((input) => {
    input.addEventListener("change", () => setStatusError(""));
  });
}

document.getElementById("loginForm").addEventListener("submit", handleLogin);
document.getElementById("signupForm").addEventListener("submit", handleSignup);

switchAuthMode(authMode);
initializeDates();
attachFieldListeners();
restoreSession();
