/**
 * Utility to format event dates.
 * Handles both single dates and comma-separated multiple dates safely.
 */
export function formatEventDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    day: "numeric",
    month: "short",
    year: "numeric"
  };

  if (dateStr.includes(",")) {
    return dateStr
      .split(",")
      .map((part) => {
        const trimmed = part.trim();
        const parsed = new Date(trimmed);
        if (isNaN(parsed.getTime())) return trimmed;
        return parsed.toLocaleDateString("id-ID", defaultOptions);
      })
      .join(", ");
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("id-ID", defaultOptions);
}
