import { useEffect, useMemo, useState } from "react";
import AnalyticsCard from "../components/AnalyticsCard";
import CountCard from "../components/CountCard";
import Header from "../components/Header";
import VoteCard from "../components/VoteCard";
import { getAnalytics, getCount, submitVote } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { formatPrettyDate, getDeadlineMessage, getTodayIso } from "../utils/date";

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const today = useMemo(() => getTodayIso(), []);
  const [voteDate, setVoteDate] = useState(today);
  const [countDate, setCountDate] = useState(today);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [voteLoading, setVoteLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [voteMessage, setVoteMessage] = useState(null);
  const [countMessage, setCountMessage] = useState(null);
  const [countData, setCountData] = useState({
    dateLabel: formatPrettyDate(today),
    yes: 0,
    no: 0,
    total: 0
  });
  const [analytics, setAnalytics] = useState([]);

  const refreshCount = async (silent = false) => {
    setCountLoading(true);

    try {
      const result = await getCount(countDate);
      setCountData({
        dateLabel: formatPrettyDate(result.date),
        yes: result.yes,
        no: result.no,
        total: result.total
      });

      if (!silent) {
        setCountMessage({
          type: "success",
          text: `Yes: ${result.yes} | No: ${result.no} | Total: ${result.total}`
        });
      }
    } catch (error) {
      if (!silent) {
        setCountMessage({ type: "error", text: error.message });
      }
    } finally {
      setCountLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setAnalyticsLoading(true);

    try {
      const result = await getAnalytics();
      setAnalytics(result);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    refreshCount(true);
    refreshAnalytics();
  }, []);

  useEffect(() => {
    setCountData((current) => ({
      ...current,
      dateLabel: formatPrettyDate(countDate)
    }));
  }, [countDate]);

  const handleVoteSubmit = async () => {
    setVoteLoading(true);
    setVoteMessage(null);

    try {
      const result = await submitVote({ date: voteDate, status: selectedStatus }, token);
      setVoteMessage({ type: "success", text: result.message });
      setSelectedStatus("");
      await Promise.all([refreshCount(true), refreshAnalytics()]);
    } catch (error) {
      setVoteMessage({ type: "error", text: error.message });
    } finally {
      setVoteLoading(false);
    }
  };

  return (
    <div className="page-shell dashboard-page">
      <Header
        onLogout={logout}
        subtitle="Daily meal operations, organized."
        title="PrepWise Workspace"
        userLabel={`Signed in as ${user.name}`}
      />

      <main className="dashboard-layout">
        <section className="app-overview shell-card">
          <div className="app-overview-copy">
            <p className="eyebrow">Workspace</p>
            <h1>Daily meal operations, organized.</h1>
            <p className="app-overview-text">
              Submit today's vote, review demand instantly, and track attendance trends from one clean operational surface.
            </p>
          </div>

          <div className="app-overview-stats">
            <article className="app-stat-card app-stat-card-primary">
              <span className="snapshot-label">Signed in as</span>
              <strong>{user.name}</strong>
              <p>{`${user.email} • ID ${user.userId}`}</p>
            </article>
            <article className="app-stat-card">
              <span className="snapshot-label">Today</span>
              <strong>{formatPrettyDate(today)}</strong>
              <p>{getDeadlineMessage()}</p>
            </article>
            <article className="app-stat-card">
              <span className="snapshot-label">Analytics</span>
              <strong>{analytics.length ? `${analytics.length} tracked days` : "Waiting for data"}</strong>
              <p>Trend visibility updates automatically after vote activity.</p>
            </article>
          </div>
        </section>

        <section className="dashboard-grid-shell">
          <section className="dashboard-row">
            <div className="dashboard-main-column">
              <VoteCard
                loading={voteLoading}
                message={voteMessage}
                onStatusChange={setSelectedStatus}
                onSubmit={handleVoteSubmit}
                onVoteDateChange={setVoteDate}
                selectedStatus={selectedStatus}
                user={user}
                voteDate={voteDate}
              />
            </div>

            <div className="dashboard-side-column">
              <CountCard
                countData={countData}
                countDate={countDate}
                loading={countLoading}
                message={countMessage}
                onCountDateChange={setCountDate}
                onLoad={() => refreshCount(false)}
              />
            </div>
          </section>

          <section className="dashboard-row analytics-row">
            <AnalyticsCard analytics={analytics} loading={analyticsLoading} onRefresh={refreshAnalytics} />
          </section>
        </section>
      </main>
    </div>
  );
}
