import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function AnalyticsCard({ analytics, loading, onRefresh }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || analytics.length === 0) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: analytics.map((item) => item.date),
        datasets: [
          {
            label: "Yes votes",
            data: analytics.map((item) => item.yes),
            borderColor: "#67d7a7",
            backgroundColor: "rgba(103, 215, 167, 0.14)",
            fill: true,
            tension: 0.32,
            borderWidth: 3
          },
          {
            label: "No votes",
            data: analytics.map((item) => item.no),
            borderColor: "#4daef7",
            backgroundColor: "rgba(77, 174, 247, 0.12)",
            fill: true,
            tension: 0.32,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [analytics]);

  const highestYes = analytics.reduce((max, item) => Math.max(max, item.yes), 0);
  const latest = analytics[analytics.length - 1];

  return (
    <section className="panel shell-card analytics-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Vote trends over time</h2>
        </div>
        <div className="panel-badge analytics-badge">Trend view</div>
      </div>

      <p className="panel-intro">
        Understand demand patterns across dates with a cleaner chart built for real operational reporting.
      </p>

      <div className="analytics-metrics">
        <div className="metric-card">
          <span className="snapshot-label">Dates tracked</span>
          <strong>{analytics.length}</strong>
        </div>
        <div className="metric-card">
          <span className="snapshot-label">Highest yes</span>
          <strong>{highestYes}</strong>
        </div>
        <div className="metric-card">
          <span className="snapshot-label">Latest total</span>
          <strong>{latest ? latest.yes + latest.no : 0}</strong>
        </div>
      </div>

      <div className="analytics-toolbar">
        <div className="analytics-status">
          {loading
            ? "Refreshing analytics..."
            : analytics.length
              ? "Analytics synced with the latest vote data."
              : "No analytics data yet."}
        </div>
        <button className="ghost-btn analytics-refresh" type="button" onClick={onRefresh} disabled={loading}>
          Refresh Analytics
        </button>
      </div>

      <div className="chart-shell">
        {analytics.length ? (
          <canvas ref={canvasRef} />
        ) : (
          <div className="analytics-empty">
            No analytics data yet. Submit a few votes to unlock trend insights.
          </div>
        )}
      </div>
    </section>
  );
}
