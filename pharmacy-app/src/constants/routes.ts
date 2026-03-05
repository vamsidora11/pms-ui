export const ROUTES = {
  LOGIN: "/login",

  MANAGER: {
    BASE: "/manager",
    DASHBOARD: "/manager/dashboard",
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
      DISPENSE: "/pharmacist/dispense",
  },

  TECHNICIAN: {
    BASE: "/technician",
    DASHBOARD: "/technician/dashboard",
     INVENTORY: "/technician/inventory",
    
  },

  FALLBACK: "*",
};
