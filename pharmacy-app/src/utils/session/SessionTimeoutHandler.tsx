import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSessionTimeout } from "./useSessionTimeout";
import WarningModal from "./WarningModal";
import { refreshAccess, logout, serverLogout } from "@store/auth/authSlice";
import type { RootState, AppDispatch } from "@store/index";

// ✅ CONFIG
const INACTIVITY_X_MS = 20 * 1000; // X seconds before modal
const WARNING_Y_SEC = 10;          // Y seconds countdown

export default function SessionTimeoutHandler() {
  const dispatch = useDispatch<AppDispatch>();

  const isAuthenticated = useSelector(
    (s: RootState) => Boolean(s.auth.user)
  );

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_Y_SEC);

  // ✅ Triggered AFTER X seconds of inactivity
  const handleInactive = useCallback(() => {
    setShowWarning(true);
    setCountdown(WARNING_Y_SEC);
  }, []);

  // ✅ Inactivity timer (paused during warning)
  useSessionTimeout({
    inactivityMs: INACTIVITY_X_MS,
    enabled: isAuthenticated && !showWarning,
    onInactive: handleInactive,
  });

  // ✅ Countdown while warning is shown
  useEffect(() => {
    if (!showWarning) return;

    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showWarning]);

  // ✅ Logout when countdown reaches 0
  useEffect(() => {
    if (!showWarning || countdown > 0) return;

    dispatch(serverLogout());
    dispatch(logout());
  }, [countdown, showWarning, dispatch]);

  // ✅ HARD RESET after logout (this fixes your last issue)
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      setCountdown(WARNING_Y_SEC);
    }
  }, [isAuthenticated]);

  // ✅ Continue session works correctly
  const continueSession = async () => {
    try {
      await dispatch(refreshAccess()).unwrap();
      setShowWarning(false); // re‑enables inactivity timer
      setCountdown(WARNING_Y_SEC);
    } catch {
      // refresh failed → countdown continues
    }
  };

  return (
    <WarningModal
      open={showWarning}
      countdown={countdown}
      onContinue={continueSession}
      onLogout={() => setCountdown(0)}
    />
  );
}