import api from "./axiosInstance";
import { ENDPOINTS } from "./endpoints";

export async function loginApi(credentials: { username: string; password: string }) {
  try {
    const res = await api.post(ENDPOINTS.login, credentials);
    return res.data as { accessToken: string };
  } catch (error) {
    console.error("Login failed:", error);
    throw error; // rethrow so UI can show a message
  }
}

export async function refreshApi() {
  try {
    console.log("refreshed");
    const res = await api.post(ENDPOINTS.refresh);
    return res.data as { accessToken: string };
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
}

export async function logoutApi() {
  try {
    await api.post(ENDPOINTS.logout);
    return {};
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}
