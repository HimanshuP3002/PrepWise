export const VOTING_DEADLINE_HOUR = 22;

export function getTodayIso() {
  return new Date().toISOString().split("T")[0];
}

export function formatPrettyDate(dateString) {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function getDeadlineMessage(now = new Date()) {
  const deadline = new Date(now);
  deadline.setHours(VOTING_DEADLINE_HOUR, 0, 0, 0);

  if (now <= deadline) {
    const diffMs = deadline.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left before the voting deadline.`;
  }

  return "Voting closes after 10:00 PM server time. Late submissions are blocked.";
}
