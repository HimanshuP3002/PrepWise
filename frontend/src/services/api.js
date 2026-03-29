const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), options);
  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

export function signup(payload) {
  return request("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function login(payload) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function getCurrentUser(token) {
  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function submitVote(payload, token) {
  return request("/vote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function getCount(date) {
  return request(`/count/${date}`);
}

export function getAnalytics() {
  return request("/analytics");
}
