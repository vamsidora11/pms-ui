
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
      .map((item: any) => (item?.code ?? "").toString().trim())
      .filter((s: string) => s.length > 0);

    return labels;
  } catch (err: any) {
    if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") throw err;
    console.error("searchAllergies failed:", {
      status: err?.response?.status,
      data: err?.response?.data,
    });
    throw err;
  }
}
``
