const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(date: string | null | undefined): string {
  if (!date) {
    return "Unknown";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return dateFormatter.format(parsed);
}

export function formatStatus(status: string): string {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (["approve", "approved", "published"].includes(normalized)) {
    return "Approved";
  }

  if (["reject", "decline", "rejected"].includes(normalized)) {
    return "Rejected";
  }

  if (["banned", "ban"].includes(normalized)) {
    return "Banned";
  }

  if (!normalized) {
    return "Unknown";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
