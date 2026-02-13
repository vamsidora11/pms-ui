 // loginApi > should return accessToken on successful login
// loginApi > should log error and rethrow if login fails
// refreshApi > should return accessToken on successful refresh
// refreshApi > should log error and rethrow if refresh fails
// logoutApi > should call logout endpoint successfully
// logoutApi > should log error and rethrow if logout fails

import { describe, it, expect, vi, beforeEach } from "vitest";

// ✅ Mock BEFORE importing the module under test
vi.mock("../axiosInstance", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("../endpoints", () => ({
  ENDPOINTS: {
    login: "/login",
    refresh: "/refresh",
    logout: "/logout",
  },
}));

import { loginApi, refreshApi, logoutApi } from "../auth";
import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

describe("auth API", () => {
  const mockedPost = vi.mocked(api.post);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loginApi", () => {
    it("should return accessToken on successful login", async () => {
      mockedPost.mockResolvedValueOnce({
        data: { accessToken: "mock-token" },
      } as { data: { accessToken: string } });

      const result = await loginApi({
        username: "test",
        password: "1234",
      });

      expect(mockedPost).toHaveBeenCalledWith(ENDPOINTS.login, {
        username: "test",
        password: "1234",
      });

      expect(result).toEqual({ accessToken: "mock-token" });
    });

    it("should log error and rethrow if login fails", async () => {
      const error = new Error("Login error");
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockedPost.mockRejectedValueOnce(error);

      await expect(
        loginApi({ username: "test", password: "1234" })
      ).rejects.toThrow(error);

      expect(console.error).toHaveBeenCalledWith("Login failed:", error);
    });
  });

  describe("refreshApi", () => {
    it("should return accessToken on successful refresh", async () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      mockedPost.mockResolvedValueOnce({
        data: { accessToken: "new-token" },
      } as { data: { accessToken: string } });

      const result = await refreshApi();

      expect(console.log).toHaveBeenCalledWith("refreshed");
      expect(mockedPost).toHaveBeenCalledWith(ENDPOINTS.refresh);
      expect(result).toEqual({ accessToken: "new-token" });
    });

    it("should log error and rethrow if refresh fails", async () => {
      const error = new Error("Refresh error");
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockedPost.mockRejectedValueOnce(error);

      await expect(refreshApi()).rejects.toThrow(error);

      expect(console.error).toHaveBeenCalledWith(
        "Token refresh failed:",
        error
      );
    });
  });

  describe("logoutApi", () => {
    it("should call logout endpoint successfully", async () => {
      mockedPost.mockResolvedValueOnce({} as Record<string, never>);

      await logoutApi();

      expect(mockedPost).toHaveBeenCalledWith(ENDPOINTS.logout);
    });

    it("should log error and rethrow if logout fails", async () => {
      const error = new Error("Logout error");
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockedPost.mockRejectedValueOnce(error);

      await expect(logoutApi()).rejects.toThrow(error);

      expect(console.error).toHaveBeenCalledWith("Logout failed:", error);
    });
  });
});
