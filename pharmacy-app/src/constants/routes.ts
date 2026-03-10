export const ROUTES = {
  LOGIN: "/login",

  MANAGER: {
    BASE: "/manager",
    DASHBOARD: "/manager/dashboard",
    USERS: "/manager/users",
  },

  PHARMACIST: {
    BASE: "/pharmacist",
    DASHBOARD: "/pharmacist/dashboard",
    ENTRY: "/pharmacist/entry",
    VALIDATION: "/pharmacist/validation",
    LABELS: "/pharmacist/labels",
    REFILLS: "/pharmacist/refills",
    HISTORY: "/pharmacist/history",
    PROFILES: "/pharmacist/profiles",
  },

  TECHNICIAN: {
    BASE: "/technician",
    DASHBOARD: "/technician/dashboard",
  },

  FALLBACK: "*",
};
