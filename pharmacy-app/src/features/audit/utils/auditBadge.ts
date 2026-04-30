export type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "outline";

export function getAuditBadgeVariant(action: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    // Authentication
    LoginSuccess: "success",
    RefreshTokenSuccess: "success",
    Logout: "secondary",

    LoginFailed: "error",
    RefreshTokenFailed: "error",

    // Users
    UserCreated: "default",
    UserUpdated: "default",
    RoleChanged: "warning",
    PasswordReset: "warning",
    UserActivated: "success",
    UserDeactivated: "error",

    // Patients
    PatientCreated: "default",
    PatientUpdated: "default",

    // Products
    ProductCreated: "default",
    ProductUpdated: "default",

    // Prescriptions
    PrescriptionCreated: "secondary",
    PrescriptionReviewed: "secondary",
    PrescriptionCancelled: "error",
    PrescriptionCompleted: "success",

    // Dispense Workflow
    DispenseCreated: "secondary",
    DispenseExecuted: "success",
    DispenseCancelled: "error",

    // Payments
    PaymentRecorded: "default",
    PaymentProcessed: "success",
    InsuranceClaimed: "warning",

    // Lots
    LotRequested: "secondary",
    LotApproved: "success",
    LotRejected: "error",
  };

  return map[action] || "outline";
}