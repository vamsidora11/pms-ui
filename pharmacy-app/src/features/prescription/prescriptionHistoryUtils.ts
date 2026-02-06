/* ============================
   Pure helpers (SRP)
============================ */

export function calculateAgeFromDob(dob?: string): number | null {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function statusStyle(status: string) {
  switch (status) {
    case "Created":
      return "bg-amber-100 text-amber-800 border border-amber-300";
    case "Validated":
    case "Active":
      return "bg-sky-100 text-sky-800 border border-sky-300";
    case "Payment Processed":
      return "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300";
    case "Dispensed":
    case "Completed":
      return "bg-emerald-100 text-emerald-800 border border-emerald-300";
    case "Cancelled":
    case "Canceled":
      return "bg-rose-100 text-rose-800 border border-rose-300";
    case "Rejected":
      return "bg-red-100 text-red-800 border border-red-300";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-300";
  }
}

export function formatDateTime(value?: string) {
  if (!value) return { date: "—", time: "—" };

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "—" };

  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}