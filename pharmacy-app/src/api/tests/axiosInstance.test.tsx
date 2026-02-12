// loginApi should return accessToken on success 
// loginApi should throw on failure 
// refreshApi should return accessToken on success 
// refreshApi should throw on failure
// logoutApi should call logout endpoint successfully 
// logoutApi should throw on failure 
import { describe, it, expect, vi, beforeEach } from "vitest";
import axiosInstance from "../axiosInstance";
import { loginApi, refreshApi, logoutApi } from "../auth";

// Mock axiosInstance
vi.mock("../axiosInstance");
const mockedAxios = vi.mocked(axiosInstance, true);

describe("auth API", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedAxios.post.mockReset();
  });

  // -------------------
  it("loginApi should return accessToken on success", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { accessToken: "mock-token" } });

    const res = await loginApi({ username: "user", password: "pass" });

    expect(res.accessToken).toBe("mock-token");
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/auth/login", {
      username: "user",
      password: "pass",
    });
  });

  it("loginApi should throw on failure", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("login failed"));

    await expect(loginApi({ username: "user", password: "pass" })).rejects.toThrow(
      "login failed"
    );
  });

  // -------------------
  it("refreshApi should return accessToken on success", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { accessToken: "new-token" } });

    const res = await refreshApi();

    expect(res.accessToken).toBe("new-token");
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/auth/refresh");
  });

  it("refreshApi should throw on failure", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("refresh failed"));

    await expect(refreshApi()).rejects.toThrow("refresh failed");
  });

  // -------------------
  it("logoutApi should call logout endpoint successfully", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    const res = await logoutApi();

    expect(res).toEqual({});
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/auth/logout");
  });

  it("logoutApi should throw on failure", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("logout failed"));

    await expect(logoutApi()).rejects.toThrow("logout failed");
  });
});
