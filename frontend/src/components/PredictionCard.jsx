import { formatPrettyDate } from "../utils/date";

export default function PredictionCard({ predictionData, loading, forecastDays, onForecastDaysChange, onRefresh }) {
  const forecasts = predictionData?.forecasts || [];

  return (
    <section className="panel shell-card prediction-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Forecast</p>
          <h2>Predicted meal demand</h2>
        </div>
        <div className="panel-badge prediction-badge">Phase D</div>
      </div>

      <p className="panel-intro">
        PrepWise uses recent demand trends and weekday patterns to estimate upcoming yes/no meal counts.
      </p>

      <div className="prediction-toolbar">
        <label className="field-label prediction-select">
          <span>Forecast window</span>
          <select
            className="form-control"
            value={forecastDays}
            onChange={(event) => onForecastDaysChange(Number(event.target.value))}
          >
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
            <option value={10}>10 days</option>
          </select>
        </label>

        <button className="ghost-btn analytics-refresh" type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Forecast"}
        </button>
      </div>

      <div className="prediction-summary-grid">
        <div className="metric-card">
          <span className="snapshot-label">Model</span>
          <strong>{predictionData?.model || "weighted-trend-forecast"}</strong>
        </div>
        <div className="metric-card">
          <span className="snapshot-label">History days</span>
          <strong>{predictionData?.historyDays || 0}</strong>
        </div>
        <div className="metric-card">
          <span className="snapshot-label">Forecast rows</span>
          <strong>{forecasts.length}</strong>
        </div>
      </div>

      <div className="prediction-table">
        <div className="prediction-table-head">
          <span>Date</span>
          <span>Yes</span>
          <span>No</span>
          <span>Total</span>
          <span>Confidence</span>
        </div>

        {forecasts.length ? (
          forecasts.map((forecast) => (
            <div className="prediction-table-row" key={forecast.date}>
              <span>{formatPrettyDate(forecast.date)}</span>
              <strong>{forecast.predictedYes}</strong>
              <strong>{forecast.predictedNo}</strong>
              <strong>{forecast.predictedTotal}</strong>
              <span>{forecast.confidence}%</span>
            </div>
          ))
        ) : (
          <div className="analytics-empty prediction-empty">
            Not enough historical data yet. Submit more votes to unlock predictions.
          </div>
        )}
      </div>
    </section>
  );
}
