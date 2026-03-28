const API_BASE_URL =
  window.location.protocol === "http:" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://localhost:5000";

const STORAGE_KEY = "prepwise-session";
const THEME_STORAGE_KEY = "prepwise-theme";
const LOGIN_PATH = "/login";
const APP_PATH = "/app";
const VOTING_DEADLINE_HOUR = 22;

let currentUser = null;
let currentToken = null;
let authMode = "login";
let activeRequests = 0;
let globalLoaderInterval;

function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getElement(id) {
  return document.getElementById(id);
}

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applyTheme(theme) {
  const normalizedTheme = theme === "light" ? "light" : "dark";
  const body = document.body;
  const themeToggle = getElement("themeToggle");
  const themeToggleLabel = getElement("themeToggleLabel");
  const themeIcon = themeToggle?.querySelector(".theme-icon");

  if (!body) {
    return;
  }

  body.setAttribute("data-theme", normalizedTheme);

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      normalizedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  if (themeToggleLabel) {
    themeToggleLabel.innerText = normalizedTheme === "dark" ? "Dark mode" : "Light mode";
  }

  if (themeIcon) {
    themeIcon.innerText = normalizedTheme === "dark" ? "dark_mode" : "light_mode";
  }
}

function initializeTheme() {
  const storedTheme = getStoredTheme();
  const systemPrefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  const initialTheme = storedTheme || (systemPrefersLight ? "light" : "dark");
  applyTheme(initialTheme);
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme") === "light" ? "light" : "dark";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  saveTheme(nextTheme);
}

function formatPrettyDate(dateString) {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function updateSystemLabels(dateString) {
  const systemDate = getElement("systemDate");
  const prettyToday = getElement("prettyToday");
  const selectedDateLabel = getElement("selectedDateLabel");
  const todayPretty = formatPrettyDate();
  const selectedPretty = formatPrettyDate(dateString);

  if (systemDate) {
    systemDate.innerText = todayPretty;
  }

  if (prettyToday) {
    prettyToday.innerText = todayPretty;
  }

  if (selectedDateLabel) {
    selectedDateLabel.innerText = `Selected: ${selectedPretty}`;
  }
}

function updateDeadlineStatus() {
  const deadlineDisplay = getElement("deadlineDisplay");
  const deadlineStatus = getElement("deadlineStatus");
  const now = new Date();
  const deadline = new Date(now);
  deadline.setHours(VOTING_DEADLINE_HOUR, 0, 0, 0);

  if (deadlineDisplay) {
    deadlineDisplay.innerText = "10:00 PM";
  }

  if (!deadlineStatus) {
    return;
  }

  if (now <= deadline) {
    const diffMs = deadline.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    deadlineStatus.innerText = `${hours}h ${minutes}m left before the server voting deadline.`;
  } else {
    deadlineStatus.innerText = "Voting closes after 10:00 PM server time. Late submissions are blocked.";
  }
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
  const input = getElement(fieldId);

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
  const input = getElement(fieldId);
  const error = getElement(`${fieldId}Error`);

  if (input) {
    input.classList.toggle("invalid", Boolean(message));
  }

  if (error) {
    error.innerText = message || "";
  }
}

function setStatusError(message) {
  const statusGroup = getElement("statusGroup");
  const error = getElement("statusError");

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

  const email = getElement("loginEmail").value.trim();
  const password = getElement("loginPassword").value.trim();
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

  const userId = getElement("signupUserId").value.trim();
  const name = getElement("signupName").value.trim();
  const email = getElement("signupEmail").value.trim();
  const password = getElement("signupPassword").value;
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

  const date = getElement("date").value;
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
  const countDate = getElement("countDate").value;

  if (!countDate) {
    setFieldError("countDate", "Please select a reporting date.");
    return false;
  }

  return true;
}

function showToast(elementId, message, type) {
  const resultDiv = getElement(elementId);

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

  getElement("loginTab").classList.toggle("active", mode === "login");
  getElement("signupTab").classList.toggle("active", mode === "signup");
  getElement("loginForm").classList.toggle("hidden", mode !== "login");
  getElement("signupForm").classList.toggle("hidden", mode !== "signup");
}

function updateCountBars(yesCount = 0, noCount = 0) {
  const yesBar = getElement("yesBar");
  const noBar = getElement("noBar");
  const total = yesCount + noCount;
  const yesWidth = total ? Math.max((yesCount / total) * 100, yesCount ? 12 : 0) : 0;
  const noWidth = total ? Math.max((noCount / total) * 100, noCount ? 12 : 0) : 0;

  if (yesBar) {
    yesBar.style.width = `${yesWidth}%`;
  }

  if (noBar) {
    noBar.style.width = `${noWidth}%`;
  }
}

function updateSnapshot(data) {
  const liveDate = getElement("liveDate");
  const liveYes = getElement("liveYes");
  const liveNo = getElement("liveNo");
  const liveTotal = getElement("liveTotal");

  if (liveDate) {
    liveDate.innerText = data.date ? formatPrettyDate(data.date) : "Not loaded";
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

  updateCountBars(data.yes ?? 0, data.no ?? 0);
}

function updateStatusPreview() {
  const selected = document.querySelector('input[name="status"]:checked');
  const preview = getElement("statusPreview");

  if (!preview) {
    return;
  }

  if (!selected) {
    preview.innerText = "Choose status";
    return;
  }

  preview.innerText = selected.value === "yes" ? "Meal included" : "Skipping meal";
}

function renderSession(user, token) {
  currentUser = user;
  currentToken = token;

  const isAuthenticated = Boolean(user && token);
  const onLoginPage = window.location.pathname === LOGIN_PATH;
  const onAppPage = window.location.pathname === APP_PATH;
  const authStatus = getElement("authStatus");
  const logoutBtn = getElement("logoutBtn");
  const authWorkspace = getElement("authWorkspace");
  const appPanel = getElement("appPanel");

  if (authStatus) {
    authStatus.innerText = isAuthenticated ? `Signed in as ${user.name}` : "Not signed in";
  }

  if (logoutBtn) {
    logoutBtn.classList.toggle("hidden", !isAuthenticated);
  }

  if (authWorkspace) {
    authWorkspace.classList.toggle("hidden", isAuthenticated && onAppPage);
  }

  if (appPanel) {
    appPanel.classList.toggle("hidden", !(isAuthenticated && onAppPage));
  }

  getElement("accountUserId").innerText = isAuthenticated ? user.userId : "Not signed in";
  getElement("accountName").innerText = isAuthenticated ? user.name : "-";
  getElement("accountEmail").innerText = isAuthenticated ? user.email : "-";
  getElement("voteUserId").innerText = isAuthenticated ? user.userId : "-";
  getElement("voteName").innerText = isAuthenticated ? user.name : "-";

  if (isAuthenticated && onLoginPage) {
    redirectTo(APP_PATH);
    return;
  }

  if (!isAuthenticated && onAppPage) {
    redirectTo(LOGIN_PATH);
  }
}

function showGlobalLoader() {
  activeRequests += 1;
  let loader = getElement("global-loader");

  if (!loader) {
    loader = document.createElement("div");
    loader.id = "global-loader";
    Object.assign(loader.style, {
      position: "fixed",
      top: "0",
      left: "0",
      height: "4px",
      background: "linear-gradient(90deg, #5ffbf1, #ffd66b, #726bff)",
      zIndex: "9999",
      transition: "width 0.4s ease, opacity 0.4s ease",
      width: "0%",
      opacity: "1",
      boxShadow: "0 0 12px rgba(95, 251, 241, 0.45)",
      pointerEvents: "none"
    });
    document.body.appendChild(loader);
  }

  if (activeRequests === 1) {
    loader.style.opacity = "1";
    loader.style.width = "20%";
    clearInterval(globalLoaderInterval);
    globalLoaderInterval = setInterval(() => {
      const currentWidth = parseFloat(loader.style.width);
      if (currentWidth < 90) {
        loader.style.width = `${currentWidth + (95 - currentWidth) * 0.05}%`;
      }
    }, 200);
  }
}

function hideGlobalLoader() {
  activeRequests = Math.max(0, activeRequests - 1);

  if (activeRequests === 0) {
    const loader = getElement("global-loader");
    if (!loader) {
      return;
    }

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

  const button = getElement("signupBtn");
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
        userId: getElement("signupUserId").value.trim(),
        name: getElement("signupName").value.trim(),
        email: getElement("signupEmail").value.trim(),
        password: getElement("signupPassword").value
      })
    });

    saveSession({ token: result.token, user: result.user });
    renderSession(result.user, result.token);
    getElement("signupForm").reset();
    updateStatusPreview();
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

  const button = getElement("loginBtn");
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
        email: getElement("loginEmail").value.trim(),
        password: getElement("loginPassword").value
      })
    });

    saveSession({ token: result.token, user: result.user });
    renderSession(result.user, result.token);
    getElement("loginForm").reset();
    updateStatusPreview();
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
  updateStatusPreview();
  redirectTo(LOGIN_PATH);
}

async function restoreSession() {
  const session = getSession();

  if (!session?.token || !session?.user) {
    renderSession(null, null);
    return;
  }

  const authStatus = getElement("authStatus");
  if (authStatus) {
    authStatus.innerHTML = '<span class="spinner" style="border-width:2px;width:14px;height:14px;margin-right:8px;"></span>Restoring session...';
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

  const submitBtn = getElement("submitBtn");
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
        date: getElement("date").value,
        status: document.querySelector('input[name="status"]:checked')?.value || null
      })
    });

    clearVoteErrors();
    document.querySelectorAll('input[name="status"]').forEach((input) => {
      input.checked = false;
    });
    updateStatusPreview();
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

  const countBtn = getElement("countBtn");
  const originalText = countBtn.innerHTML;
  countBtn.innerHTML = '<div class="spinner"></div> Loading...';
  countBtn.disabled = true;

  try {
    const date = getElement("countDate").value;
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
  const voteDateInput = getElement("date");
  const countDateInput = getElement("countDate");

  if (voteDateInput && !voteDateInput.value) {
    voteDateInput.value = today;
  }

  if (countDateInput && !countDateInput.value) {
    countDateInput.value = today;
  }

  updateSystemLabels(today);
  updateSnapshot({ date: today, yes: 0, no: 0, total: 0 });
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
    const element = getElement(fieldId);

    if (!element) {
      return;
    }

    element.addEventListener("input", () => setFieldError(fieldId, ""));
    element.addEventListener("change", () => setFieldError(fieldId, ""));
  });

  const voteDateInput = getElement("date");
  const countDateInput = getElement("countDate");

  if (voteDateInput) {
    voteDateInput.addEventListener("change", () => {
      updateSystemLabels(voteDateInput.value);
    });
  }

  if (countDateInput) {
    countDateInput.addEventListener("change", () => {
      const chosenDate = countDateInput.value;
      if (chosenDate) {
        updateSnapshot({
          date: chosenDate,
          yes: Number(getElement("liveYes")?.innerText || 0),
          no: Number(getElement("liveNo")?.innerText || 0),
          total: Number(getElement("liveTotal")?.innerText || 0)
        });
      }
    });
  }

  document.querySelectorAll('input[name="status"]').forEach((input) => {
    input.addEventListener("change", () => {
      setStatusError("");
      updateStatusPreview();
    });
  });
}

function startDeadlineClock() {
  updateDeadlineStatus();
  setInterval(updateDeadlineStatus, 60000);
}

getElement("loginForm").addEventListener("submit", handleLogin);
getElement("signupForm").addEventListener("submit", handleSignup);

switchAuthMode(authMode);
initializeTheme();
initializeDates();
attachFieldListeners();
updateStatusPreview();
startDeadlineClock();
restoreSession();
