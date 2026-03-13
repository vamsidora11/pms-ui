type HttpErrorShape = {
  code?: string;
  message?: string;
  request?: unknown;
  response?: {
    status?: number;
    data?:
      | string
      | {
          detail?: string;
          message?: string;
          title?: string;
          errors?: Record<string, string[]>;
        };
  };
};

export const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the server. Please check your connection and try again.";

export function getHttpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }

  const httpErr = err as HttpErrorShape;
  return httpErr.response?.status;
}

export function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== "object") {
    return false;
  }

  const httpErr = err as HttpErrorShape;
  const message = httpErr.message?.toLowerCase();

  return Boolean(
    httpErr.code === "ERR_NETWORK" ||
      httpErr.code === "ECONNABORTED" ||
      (httpErr.request && !httpErr.response) ||
      message?.includes("network error") ||
      message?.includes("failed to fetch")
  );
}

export function extractApiError(err: unknown): string {
  if (typeof err === "string" && err.trim()) {
    return err;
  }

  if (!err) {
    return "Unexpected error";
  }

  if (isNetworkError(err)) {
    return NETWORK_ERROR_MESSAGE;
  }

  const anyErr = err as HttpErrorShape;
  const responseData =
    anyErr.response?.data && typeof anyErr.response.data === "object"
      ? anyErr.response.data
      : undefined;

  if (typeof anyErr.response?.data === "string" && anyErr.response.data.trim()) {
    return anyErr.response.data;
  }

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.title) {
    return responseData.title;
  }

  const validationErrors = responseData?.errors;
  if (validationErrors) {
    const firstValidationError = Object.values(validationErrors).flat()[0];
    if (firstValidationError) {
      return String(firstValidationError);
    }
  }

  if (anyErr.message?.trim()) {
    return anyErr.message;
  }

  return "Request failed";
}
