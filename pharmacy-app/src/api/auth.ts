import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

export async function loginApi(credentials: { username: string; password: string }) {
  const res = await api.post(ENDPOINTS.login, credentials);
  return res.data as { accessToken: string };
}

export async function refreshApi() {
  const res = await api.post(ENDPOINTS.refresh);
  return res.data as { accessToken: string };
}

export async function logoutApi() {
  await api.post(ENDPOINTS.logout);
}
