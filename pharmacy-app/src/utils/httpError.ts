export function extractApiError(err: unknown): string {
  if (typeof err === "string") {
    return err;
  }

  if (!err) return "Unexpected error";

  const anyErr = err as {
    response?: {
      data?: {
        detail?: string;
        message?: string;
        title?: string;
        errors?: Record<string, string[]>;
      };
    };
    message?: string;
  };

  if (anyErr.response?.data?.detail) {
    return anyErr.response.data.detail;
  }

  if (anyErr.response?.data?.message) {
    return anyErr.response.data.message;
  }

  if (anyErr.response?.data?.title) {
    return anyErr.response.data.title;
  }

  const validationErrors = anyErr.response?.data?.errors;
  if (validationErrors) {
    const firstValidationError = Object.values(validationErrors).flat()[0];
    if (firstValidationError) {
      return firstValidationError;
    }
  }

  if (anyErr.message) {
    return anyErr.message;
  }

  return "Request failed";
}
