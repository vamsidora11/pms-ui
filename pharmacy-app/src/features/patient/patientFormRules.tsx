export type PatientFormLike = {
  fullName: string;
  dob: string; // yyyy-mm-dd (UI value)
  phone: string; // E.164 format expected e.g. +919876543210
  email: string;
  address: string;
};

export type FieldResult = { value: string; warning: string };

type Rule<TForm> = {
  sanitize?: (raw: string, form: TForm) => FieldResult;
  validate?: (value: string, form: TForm) => string; // "" means ok
  warnWhileTyping?: (value: string, form: TForm) => string; // "" means no warning
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z\s]+$/;

// ✅ E.164: '+' followed by 2 to 15 digits total, first digit after + cannot be 0
// examples: +14155552671, +919876543210
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export const patientRules: Record<
  keyof PatientFormLike,
  Rule<PatientFormLike>
> = {
  fullName: {
    sanitize: (raw) => {
      const cleaned = raw.replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " ");
      const warning =
        cleaned !== raw ? "Only alphabets and spaces are allowed" : "";
      return { value: cleaned, warning };
    },
    validate: (value) => {
      const v = value.trim();
      if (!v) return "Full Name is required";
      if (!NAME_REGEX.test(v))
        return "Full Name can contain only alphabets and spaces";
      return "";
    },
  },

  dob: {
    sanitize: (raw) => ({ value: raw, warning: "" }),
    validate: (value) => {
      if (!value) return "Date of Birth is required";
      const d = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(d.getTime())) return "Invalid date of birth";
      if (d > today) return "Date of Birth cannot be in the future";
      return "";
    },
  },

  // ✅ UPDATED: Phone uses E.164 format
  phone: {
    sanitize: (raw) => {
      // keep + and digits only (basic cleanup)
      // - removes spaces, dashes, brackets etc.
      // - keeps leading '+' if user types it
      const cleaned = raw.replace(/[^\d+]/g, "");

      // ensure only one '+' and only at beginning
      const normalized = cleaned.startsWith("+")
        ? "+" + cleaned.slice(1).replace(/\+/g, "")
        : cleaned.replace(/\+/g, "");

      let warning = "";
      if (normalized !== raw)
        warning =
          "Phone number should be in international format (e.g., +919876543210).";

      // If user typed digits without '+', we can guide them
      if (normalized && !normalized.startsWith("+")) {
        warning = "Include country code with '+', e.g., +919876543210.";
      }

      return { value: normalized, warning };
    },

    warnWhileTyping: (value) => {
      const v = value.trim();
      if (!v) return "";
      // show warning until it becomes valid E.164
      return E164_REGEX.test(v)
        ? ""
        : "Enter phone in E.164 format (e.g., +919876543210).";
    },

    validate: (value) => {
      const v = value.trim();
      if (!v) return "Phone number is required";
      if (!E164_REGEX.test(v))
        return "Enter a valid international phone number (E.164), e.g., +919876543210";
      return "";
    },
  },

  email: {
    sanitize: (raw) => ({ value: raw, warning: "" }),
    warnWhileTyping: (value) => {
      const v = value.trim();
      if (!v) return "";
      return EMAIL_REGEX.test(v) ? "" : "Email format looks invalid.";
    },
    validate: (value) => {
      const v = value.trim();
      if (!v) return "";
      if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
      return "";
    },
  },

  address: {
    sanitize: (raw) => {
      const warning =
        raw.length > 50 ? "Address cannot exceed 50 characters" : "";
      return { value: raw.slice(0, 50), warning };
    },
    validate: (value) => {
      if (value.length > 50) return "Address cannot exceed 50 characters";
      return "";
    },
  },
};

export function applyPatientRule<TForm extends PatientFormLike>(
  field: keyof PatientFormLike,
  raw: string,
  form: TForm,
): FieldResult {
  const rule = patientRules[field];
  let res = rule?.sanitize
    ? rule.sanitize(raw, form)
    : { value: raw, warning: "" };

  if (rule?.warnWhileTyping) {
    const extra = rule.warnWhileTyping(res.value, form);
    res = { ...res, warning: extra || res.warning };
  }

  return res;
}

export function validatePatientForm<TForm extends PatientFormLike>(
  form: TForm,
): Record<string, string> {
  const errors: Record<string, string> = {};

  (Object.keys(patientRules) as Array<keyof PatientFormLike>).forEach(
    (field) => {
      const rule = patientRules[field];
      const msg = rule?.validate ? rule.validate(form[field], form) : "";
      if (msg) errors[field] = msg;
    },
  );

  return errors;
}
