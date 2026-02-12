export type PatientFormLike = {
  fullName: string;
  dob: string; // yyyy-mm-dd (UI value)
  phone: string; // E.164 expected e.g. +919876543210
  email: string;
  address: string;
};

export type FieldResult = { value: string; warning: string };

type Rule<TForm> = {
  /**
   * sanitize:
   * - Light normalization only.
   * - UX-first: avoid stripping characters (unless you explicitly want that).
   */
  sanitize?: (raw: string, form: TForm) => FieldResult;

  /**
   * validate:
   * - Hard validation (used on submit).
   * - Return "" if ok, else an error string.
   */
  validate?: (value: string, form: TForm) => string;

  /**
   * warnWhileTyping:
   * - Soft guidance (used onChange).
   * - Return "" if no warning.
   */
  warnWhileTyping?: (value: string, form: TForm) => string;
};

/* ================= REGEX ================= */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z\s]+$/;

/**
 * ✅ E.164: '+' followed by 8 to 15 digits total (first digit after + cannot be 0)
 * Examples: +14155552671, +919876543210
 */
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/* ================= HELPERS ================= */

const trimOrEmpty = (v: string) => (v ?? "").trim();

const isEmpty = (v: string) => trimOrEmpty(v).length === 0;

const hasNonNameChars = (v: string) => !NAME_REGEX.test(v);

const hasPhoneInvalidChars = (v: string) => /[^0-9+\s()-]/.test(v);

/* ================= RULES ================= */

export const patientRules: Record<keyof PatientFormLike, Rule<PatientFormLike>> =
  {
    fullName: {
      // ✅ Keep user input; don't delete numbers/symbols while typing
      sanitize: (raw) => ({ value: raw, warning: "" }),

      warnWhileTyping: (value) => {
        const v = value;
        if (isEmpty(v)) return "";
        return hasNonNameChars(v)
          ? "Only alphabets and spaces are allowed."
          : "";
      },

      validate: (value) => {
        const v = trimOrEmpty(value);
        if (!v) return "Full Name is required";
        if (!NAME_REGEX.test(v))
          return "Full Name can contain only alphabets and spaces";
        return "";
      },
    },

    dob: {
      sanitize: (raw) => ({ value: raw, warning: "" }),

      validate: (value) => {
        const v = trimOrEmpty(value);
        if (!v) return "Date of Birth is required";

        const d = new Date(v);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Number.isNaN(d.getTime())) return "Invalid date of birth";
        if (d > today) return "Date of Birth cannot be in the future";

        return "";
      },
    },

    phone: {
      // ✅ Keep user input; do not strip anything while typing
      sanitize: (raw) => ({ value: raw, warning: "" }),

      warnWhileTyping: (value) => {
        const v = trimOrEmpty(value);
        if (!v) return "";

        // If pasted/typed weird chars (alphabets etc.)
        if (hasPhoneInvalidChars(v)) {
          return "Phone should contain only numbers and '+' (country code)";
        }

        // Soft guide until it matches E.164
        return E164_REGEX.test(v)
          ? ""
          : "Use international format with '+', e.g., +919876543210.";
      },

      validate: (value) => {
        const v = trimOrEmpty(value);
        if (!v) return "Phone number is required";
        if (!E164_REGEX.test(v))
          return "Enter a valid international phone number (E.164), e.g., +919876543210";
        return "";
      },
    },

    email: {
      sanitize: (raw) => ({ value: raw, warning: "" }),

      warnWhileTyping: (value) => {
        const v = trimOrEmpty(value);
        if (!v) return "";
        return EMAIL_REGEX.test(v) ? "" : "Email format is invalid";
      },

      validate: (value) => {
        const v = trimOrEmpty(value);
        // email optional? (your old rule allowed empty). Keeping same behavior:
        if (!v) return "";
        if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
        return "";
      },
    },

    address: {
      sanitize: (raw) => {
        // ✅ Keep input; just warn if too long (don’t auto-trim while typing)
        const warning =
          raw.length > 50 ? "Address cannot exceed 50 characters" : "";
        return { value: raw, warning };
      },

      validate: (value) => {
        if ((value ?? "").length > 50) return "Address cannot exceed 50 characters";
        return "";
      },
    },
  };

/* ================= APPLY RULE (onChange) ================= */

export function applyPatientRule<TForm extends PatientFormLike>(
  field: keyof PatientFormLike,
  raw: string,
  form: TForm
): FieldResult {
  const rule = patientRules[field];

  // sanitize (light normalization only)
  let res: FieldResult = rule?.sanitize
    ? rule.sanitize(raw, form)
    : { value: raw, warning: "" };

  // warn while typing
  if (rule?.warnWhileTyping) {
    const w = rule.warnWhileTyping(res.value, form);
    res = { ...res, warning: w || res.warning };
  }

  return res;
}

/* ================= VALIDATE FORM (onSubmit) ================= */

export function validatePatientForm<TForm extends PatientFormLike>(
  form: TForm
): Record<keyof PatientFormLike, string> {
  const errors = {} as Record<keyof PatientFormLike, string>;

  (Object.keys(patientRules) as Array<keyof PatientFormLike>).forEach((field) => {
    const rule = patientRules[field];
    const msg = rule?.validate ? rule.validate(form[field], form) : "";
    if (msg) errors[field] = msg;
  });

  return errors;
}