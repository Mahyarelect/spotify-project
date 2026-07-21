import { apiRequest } from "@/lib/api/httpClient";
import { clearTokens, getRefreshToken, setTokens } from "@/lib/api/tokenStore";
import { mapUser, type AuthResponseDto } from "@/lib/api/dto";
import type { Gender, User } from "@/types/user";

export interface ListenerRegistrationInput {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  gender: Gender;
  acceptPolicy: boolean;
}

function storeAuthResponse(response: AuthResponseDto): User {
  setTokens({ access: response.access, refresh: response.refresh });
  return mapUser(response.user);
}

export async function login(email: string, password: string) {
  const response = await apiRequest<AuthResponseDto>("auth/login/", {
    method: "POST",
    skipAuth: true,
    skipRefresh: true,
    body: JSON.stringify({ email, password }),
  });
  const user = storeAuthResponse(response);
  return { user, role: user.role };
}

export async function registerListener(data: ListenerRegistrationInput): Promise<User> {
  const response = await apiRequest<AuthResponseDto>("auth/register/", {
    method: "POST",
    skipAuth: true,
    skipRefresh: true,
    body: JSON.stringify({
      display_name: data.displayName,
      email: data.email,
      password: data.password,
      password_confirm: data.confirmPassword,
      birth_date: data.birthDate,
      gender: data.gender,
      accept_policy: data.acceptPolicy,
    }),
  });
  return storeAuthResponse(response);
}

export async function registerArtist(data: {
  email: string;
  password: string;
  confirmPassword: string;
  artistName: string;
  portfolioUrl: string;
}): Promise<{ id: string; status: "pending"; submittedAt: string }> {
  const response = await apiRequest<{ id: string; status: "pending"; submitted_at: string }>(
    "auth/artist-applications/",
    {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        password_confirm: data.confirmPassword,
        artist_name: data.artistName,
        portfolio_url: data.portfolioUrl,
      }),
    },
  );
  return { id: response.id, status: response.status, submittedAt: response.submitted_at };
}

export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>("auth/password-reset/", {
    method: "POST",
    skipAuth: true,
    skipRefresh: true,
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset(data: {
  uid: string;
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<void>("auth/password-reset/confirm/", {
    method: "POST",
    skipAuth: true,
    skipRefresh: true,
    body: JSON.stringify({
      uid: data.uid,
      token: data.token,
      password: data.password,
      password_confirm: data.confirmPassword,
    }),
  });
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  const request = refresh
    ? apiRequest<void>("auth/logout/", {
        method: "POST",
        skipRefresh: true,
        body: JSON.stringify({ refresh }),
      }).catch(() => undefined)
    : Promise.resolve();
  clearTokens();
  await request;
}
