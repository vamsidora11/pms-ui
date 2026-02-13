
import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

/**
 * Search allergy catalog by text. Returns string[] of codes/labels.
 * Backend returns [{ code: string }], so we map to string[].
 */
export async function searchAllergies(
  query: string,
  opts?: { signal?: AbortSignal; minChars?: number }
): Promise<string[]> {
  const q = (query ?? "").trim();
  const minChars = opts?.minChars ?? 2; // optional UX choice
  if (q.length < minChars) return [];

  try {
    const res = await api.get(ENDPOINTS.ALLERGY_SEARCH_ENDPOINT, {
      params: { q },           //  backend expects `q`
      signal: opts?.signal,
    });

    const data = Array.isArray(res.data) ? res.data : [];
    // Map to plain string[] while guarding against bad shapes
    const labels = data
      .map((item: unknown) => {
        if (typeof item === "object" && item !== null && "code" in item) {
          const code = (item as { code?: unknown }).code;
          if (typeof code === "string" || typeof code === "number") {
            return String(code).trim();
          }
        }
        return "";
      })
      .filter((s: string) => s.length > 0);

    return labels;
  } catch (err) {
    if (typeof err === "object" && err !== null) {
      const errorObj = err as { name?: string; code?: string };
      if (errorObj.name === "AbortError" || errorObj.code === "ERR_CANCELED") throw err;
    }
    console.error("searchAllergies failed:", {
      status:
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { status?: number; data?: unknown } }).response?.status
          : undefined,
      data:
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { status?: number; data?: unknown } }).response?.data
          : undefined,
    });
    throw err;
  }
}

