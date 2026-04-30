export function formatDate(iso: string | Date) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}
