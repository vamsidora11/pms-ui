// import { useCallback } from "react";
// import { useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";

// import { loginUser } from "@store/auth/authSlice";
// import type { AppDispatch } from "store";

// import { useToast } from "@components/common/Toast/useToast";
// import { getDashboardRoute, type Role } from "../../../routes/roleRedirect";

// type TokenPayload = {
//   role: Role;
// };

// export function useLoginFlow() {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const toast = useToast();

//   const login = useCallback(
//     async (username: string, password: string) => {
//       try {
//         const res = await dispatch(loginUser({ username, password })).unwrap();

//         if (!res?.accessToken) {
//           toast.error("Login failed", "No access token returned");
//           return;
//         }

//         const payload = jwtDecode<TokenPayload>(res.accessToken);

//         if (!payload?.role) {
//           toast.error("Login failed", "Invalid token payload");
//           return;
//         }

//         toast.success("Login successful", `Welcome ${username}`);
//         navigate(getDashboardRoute(payload.role));
//       } catch (err: unknown) {
//         // ✅ Inline, minimal, safe
//         const msg =
//           typeof err === "string"
//             ? err
//             : "Incorrect username or password";

//         toast.error("Login failed", msg);
//       }
//     },
//     [dispatch, navigate, toast]
//   );

//   return { login };
// }
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import { loginUser } from "@store/auth/authSlice";
import type { AppDispatch } from "store";

import { useToast } from "@components/common/Toast/useToast";
import { getDashboardRoute } from "../../../routes/roleRedirect";
import type { UserRole } from "@store/auth/authtype";

type TokenPayload = {
  role: UserRole;
};

export function useLoginFlow() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const toast = useToast();

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const res = await dispatch(loginUser({ username, password })).unwrap();

        if (!res?.accessToken) {
          toast.error("Login failed", "No access token returned");
          return;
        }

        const payload = jwtDecode<TokenPayload>(res.accessToken);

        if (!payload?.role) {
          toast.error("Login failed", "Invalid token payload");
          return;
        }

        toast.success("Login successful", `Welcome ${username}`);
        navigate(getDashboardRoute(payload.role));
      } catch (err: unknown) {
        const msg =
          typeof err === "string"
            ? err
            : "Incorrect username or password";

        toast.error("Login failed", msg);
      }
    },
    [dispatch, navigate, toast]
  );

  return { login };
}