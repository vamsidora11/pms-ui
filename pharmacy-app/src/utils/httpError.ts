export function extractApiError(err: unknown): string {
  if (!err) return "Unexpected error";

  const anyErr = err as {
    response?: { data?: { message?: string; title?: string } };
    message?: string;
  };

  if (anyErr.response?.data?.message) {
    return anyErr.response.data.message;
  }

  if (anyErr.response?.data?.title) {
    return anyErr.response.data.title;
  }

  if (anyErr.message) {
    return anyErr.message;
  }

  return "Request failed";
}
