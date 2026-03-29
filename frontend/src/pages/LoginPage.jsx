import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import Header from "../components/Header";
import { useAuth } from "../state/AuthContext";

export default function LoginPage() {
  const { isAuthenticated, isRestoring, login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const shellTitle = useMemo(
    () => ({
      title: "PrepWise",
      subtitle: "Meal planning command center for hostels and mess operations."
    }),
    []
  );

  if (isRestoring) {
    return <div className="screen-state">Restoring session...</div>;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/app" />;
  }

  const handleLogin = async (payload) => {
    setLoading(true);
    setMessage(null);

    try {
      await login(payload);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (payload) => {
    setLoading(true);
    setMessage(null);

    try {
      await signup(payload);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-page immersive-page">
      <Header title={shellTitle.title} subtitle={shellTitle.subtitle} />

      <main className="auth-layout">
        <section className="hero-copy shell-card hero-card">
          <p className="eyebrow">Campus meal intelligence</p>
          <h1>Turn routine attendance into a clear, modern workflow.</h1>
          <p className="hero-text">
            PrepWise combines secure access, clean voting, and operational insight in one dashboard-ready product experience.
          </p>
        </section>

        <AuthCard
          loading={loading}
          message={message}
          mode={mode}
          onLogin={handleLogin}
          onModeChange={setMode}
          onSignup={handleSignup}
        />
      </main>
    </div>
  );
}
