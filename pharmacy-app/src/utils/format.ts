// Misc formatting helpers.
// Reasoning:
// - Keep transformation/format helpers out of components.

export function formatDate(iso: string) {
  // Basic, locale-friendly date. Replace with dayjs/date-fns if preferred.
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
