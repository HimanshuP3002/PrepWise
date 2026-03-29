export default function VoteCard({
  user,
  voteDate,
  onVoteDateChange,
  selectedStatus,
  onStatusChange,
  onSubmit,
  loading,
  message
}) {
  return (
    <article className="panel shell-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Vote</p>
          <h2>Confirm your meal plan</h2>
        </div>
        <div className="panel-badge">Daily action</div>
      </div>

      <p className="panel-intro">
        Your profile is already loaded. Pick a date, choose your status, and submit in one short flow.
      </p>

      <div className="identity-strip">
        <div className="identity-chip">
          <span>User ID</span>
          <strong>{user.userId}</strong>
        </div>
        <div className="identity-chip">
          <span>Name</span>
          <strong>{user.name}</strong>
        </div>
        <div className="identity-chip accent-chip">
          <span>Selection</span>
          <strong>{selectedStatus ? (selectedStatus === "yes" ? "Meal included" : "Skipping meal") : "Choose status"}</strong>
        </div>
      </div>

      <label className="field-label">
        <span>Attendance Date</span>
        <input
          className="form-control"
          type="date"
          value={voteDate}
          onChange={(event) => onVoteDateChange(event.target.value)}
        />
      </label>

      <div className="choice-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Meal status</p>
            <p className="section-note">Choose whether you will eat on the selected date.</p>
          </div>
        </div>

        <div className="radio-group">
          <label className={`radio-card ${selectedStatus === "yes" ? "is-selected" : ""}`}>
            <input
              checked={selectedStatus === "yes"}
              name="status"
              type="radio"
              value="yes"
              onChange={(event) => onStatusChange(event.target.value)}
            />
            <span className="radio-content">
              <span className="radio-kicker">Attending</span>
              <strong>Yes, include my meal</strong>
              <small>Reserve your place in the count so the kitchen can prepare accurately.</small>
            </span>
          </label>

          <label className={`radio-card ${selectedStatus === "no" ? "is-selected no-selected" : ""}`}>
            <input
              checked={selectedStatus === "no"}
              name="status"
              type="radio"
              value="no"
              onChange={(event) => onStatusChange(event.target.value)}
            />
            <span className="radio-content">
              <span className="radio-kicker">Skipping</span>
              <strong>No, I will not eat</strong>
              <small>Reduce waste and keep the daily plan precise when you are unavailable.</small>
            </span>
          </label>
        </div>
      </div>

      <button className="btn-submit" type="button" onClick={onSubmit} disabled={loading}>
        {loading ? "Submitting..." : "Confirm Vote"}
      </button>

      {message ? <div className={`inline-message ${message.type}`}>{message.text}</div> : null}
    </article>
  );
}
