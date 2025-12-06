import { request } from "./client";
import type {
  AuthTokens,
  DirectPasswordChangePayload,
  LoginPayload,
  NormalPasswordChangePayload,
  OTPPayload,
  OTPVerifyPayload,
  PasswordChangePayload,
  PreRegisterPayload,
  RegisterPayload,
} from "./types";

export function preRegister(body: PreRegisterPayload) {
  return request<{ email?: string; username?: string }>("/auth/pre-register", {
    method: "POST",
    body,
  });
}

export function register(body: RegisterPayload) {
  return request<{ message: string; id: string }>("/auth/register", {
    method: "POST",
    body,
  });
}

export function login(body: LoginPayload) {
  return request<AuthTokens>("/auth/login", {
    method: "POST",
    body,
  });
}

export function refresh(refresh_token: string) {
  return request<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: { refresh_token },
  });
}

export function logout(token: string) {
  return request<{ message: string }>("/auth/logout", {
    method: "POST",
    token,
  });
}

export function sendOtp(body: OTPPayload) {
  return request<{ message: string }>("/auth/otp", { method: "POST", body });
}

export function verifyOtp(body: OTPVerifyPayload) {
  return request<AuthTokens>("/auth/otp/verify", { method: "POST", body });
}

export function forgotPassword(body: OTPPayload) {
  return request<{ message: string }>("/auth/password/forget", { method: "POST", body });
}

export function changePassword(token: string, body: PasswordChangePayload) {
  const isDirect = (body as DirectPasswordChangePayload).password !== undefined &&
    !(body as NormalPasswordChangePayload).current_password;

  const payload = isDirect
    ? { password: (body as DirectPasswordChangePayload).password }
    : body;

  return request<{ message: string }>("/auth/password", {
    method: "PUT",
    token,
    body: payload,
  });
}
