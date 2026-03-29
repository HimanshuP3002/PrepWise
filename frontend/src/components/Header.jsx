export default function Header({ title, subtitle, userLabel, onLogout }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">
          <img src="/assets/prepwise-logo.png" alt="PrepWise logo" />
        </span>
        <span className="brand-copy">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </span>
      </div>

      <div className="topbar-actions">
        {userLabel ? <span className="status-pill">{userLabel}</span> : null}
        {onLogout ? (
          <button className="ghost-btn" type="button" onClick={onLogout}>
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}
