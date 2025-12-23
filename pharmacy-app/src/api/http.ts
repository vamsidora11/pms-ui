import api from "./axiosInstance";

export async function http(url: string, options?: any) {
  return api({ url, ...options });
}
