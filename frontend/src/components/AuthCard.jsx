import { useState } from "react";

const initialLoginState = { email: "", password: "" };
const initialSignupState = { userId: "", name: "", email: "", password: "" };

export default function AuthCard({ mode, onModeChange, onLogin, onSignup, loading, message }) {
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    await onLogin(loginForm);
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    await onSignup(signupForm);
  };

  return (
    <section className="auth-card shell-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Access Portal</p>
          <h2>Enter the PrepWise workspace</h2>
        </div>
        <div className="panel-badge">Secure access</div>
      </div>

      <p className="panel-intro">
        Sign in or create an account to submit meal votes through a clean, verified workflow.
      </p>

      <div className="auth-tabs">
        <button
          className={`tab-btn ${mode === "login" ? "active" : ""}`}
          type="button"
          onClick={() => onModeChange("login")}
        >
          Login
        </button>
        <button
          className={`tab-btn ${mode === "signup" ? "active" : ""}`}
          type="button"
          onClick={() => onModeChange("signup")}
        >
          Sign Up
        </button>
      </div>

      {mode === "login" ? (
        <form className="stack-form" onSubmit={handleLoginSubmit}>
          <div className="auth-form-heading">
            <strong>Welcome back</strong>
            <span>Use your account to submit votes and monitor demand.</span>
          </div>

          <label className="field-label">
            <span>Email</span>
            <input
              className="form-control"
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              placeholder="you@example.com"
            />
          </label>

          <label className="field-label">
            <span>Password</span>
            <input
              className="form-control"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              placeholder="Enter password"
            />
          </label>

          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      ) : (
        <form className="stack-form" onSubmit={handleSignupSubmit}>
          <div className="auth-form-heading">
            <strong>Create your account</strong>
            <span>Get set up once and use a cleaner meal voting workflow every day.</span>
          </div>

          <div className="grid-two">
            <label className="field-label">
              <span>User ID</span>
              <input
                className="form-control"
                type="text"
                value={signupForm.userId}
                onChange={(event) => setSignupForm({ ...signupForm, userId: event.target.value })}
                placeholder="12345"
              />
            </label>

            <label className="field-label">
              <span>Full Name</span>
              <input
                className="form-control"
                type="text"
                value={signupForm.name}
                onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
                placeholder="Himanshu Pandey"
              />
            </label>
          </div>

          <label className="field-label">
            <span>Email</span>
            <input
              className="form-control"
              type="email"
              value={signupForm.email}
              onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
              placeholder="you@example.com"
            />
          </label>

          <label className="field-label">
            <span>Password</span>
            <input
              className="form-control"
              type="password"
              value={signupForm.password}
              onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
              placeholder="Minimum 6 characters"
            />
          </label>

          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      )}

      {message ? <div className={`inline-message ${message.type}`}>{message.text}</div> : null}
    </section>
  );
}
