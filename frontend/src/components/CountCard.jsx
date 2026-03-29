export default function CountCard({
  countDate,
  countData,
  onCountDateChange,
  onLoad,
  loading,
  message
}) {
  const total = countData.total || 0;
  const yesWidth = total ? Math.max((countData.yes / total) * 100, countData.yes ? 12 : 0) : 0;
  const noWidth = total ? Math.max((countData.no / total) * 100, countData.no ? 12 : 0) : 0;

  return (
    <aside className="panel shell-card ambient-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Counts</p>
          <h2>Track live meal demand</h2>
        </div>
        <div className="panel-badge panel-badge-secondary">Live totals</div>
      </div>

      <p className="panel-intro">
        Review confirmed yes/no totals for any selected day with a fast operational summary.
      </p>

      <div className="ops-snapshot">
        <div className="snapshot-card accent">
          <span className="snapshot-label">Selected date</span>
          <strong>{countData.dateLabel}</strong>
        </div>
        <div className="snapshot-row">
          <div className="snapshot-card">
            <span className="snapshot-label">Yes</span>
            <strong>{countData.yes}</strong>
          </div>
          <div className="snapshot-card">
            <span className="snapshot-label">No</span>
            <strong>{countData.no}</strong>
          </div>
          <div className="snapshot-card">
            <span className="snapshot-label">Total</span>
            <strong>{countData.total}</strong>
          </div>
        </div>
      </div>

      <div className="count-visual">
        <div className="count-bar-track">
          <div className="count-bar yes-bar" style={{ width: `${yesWidth}%` }} />
          <div className="count-bar no-bar" style={{ width: `${noWidth}%` }} />
        </div>
        <div className="count-legend">
          <span><i className="legend-dot yes-dot" />Meal yes</span>
          <span><i className="legend-dot no-dot" />Meal no</span>
        </div>
      </div>

      <label className="field-label">
        <span>Reporting Date</span>
        <input
          className="form-control"
          type="date"
          value={countDate}
          onChange={(event) => onCountDateChange(event.target.value)}
        />
      </label>

      <button className="btn-submit btn-secondary" type="button" onClick={onLoad} disabled={loading}>
        {loading ? "Loading..." : "Get Count"}
      </button>

      {message ? <div className={`inline-message ${message.type}`}>{message.text}</div> : null}
    </aside>
  );
}
