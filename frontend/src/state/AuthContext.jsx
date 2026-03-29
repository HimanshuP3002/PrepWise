import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login as loginRequest, signup as signupRequest } from "../services/api";

const STORAGE_KEY = "prepwise-session";
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const session = readStoredSession();

    if (!session?.token || !session?.user) {
      setIsRestoring(false);
      return;
    }

    getCurrentUser(session.token)
      .then((result) => {
        setUser(result.user);
        setToken(session.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: session.token, user: result.user }));
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        setIsRestoring(false);
      });
  }, []);

  const completeAuth = (result) => {
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: result.token, user: result.user }));
    return result;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isRestoring,
      async login(payload) {
        const result = await loginRequest(payload);
        return completeAuth(result);
      },
      async signup(payload) {
        const result = await signupRequest(payload);
        return completeAuth(result);
      },
      logout() {
        setUser(null);
        setToken(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    }),
    [user, token, isRestoring]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
