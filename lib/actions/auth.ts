"use server";

// lib/actions/auth.ts
// Server Actions for login, register and logout. They run on the server, call
// Laravel, and set or delete the token cookie.
//
// Important: redirect() works by throwing a special error, so it must NEVER be
// inside a try/catch. Here it is always the last line.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serverRequest, type FailedResponse } from "@/lib/api-server";
import { safeNextPath } from "@/lib/safe-redirect";
import {
  clearSessionToken,
  getSessionToken,
  setSessionToken,
} from "@/lib/session";
import type { ApiData, AuthFormState, AuthResult } from "@/lib/types";

// A label for the token in Laravel (the "device_name", API reference section 8).
const DEVICE_NAME = "Web browser";

// The fields our forms show an error for.
const FORM_FIELDS = ["name", "email", "password"];

function text(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

// Turns an error answer from Laravel into what the form shows.
function failure(
  response: FailedResponse,
  values: AuthFormState["values"],
): AuthFormState {
  if (response.status === 422 && response.errors) {
    const hasFieldError = FORM_FIELDS.some(
      (field) => (response.errors?.[field]?.length ?? 0) > 0,
    );

    return {
      errors: response.errors,
      // If the error is about a field we do not show, show the general message.
      message: hasFieldError ? undefined : response.message,
      values,
    };
  }

  if (response.status === 429) {
    return {
      message:
        response.retryAfter === null
          ? "Too many attempts. Please wait a moment and try again."
          : `Too many attempts. Please wait ${response.retryAfter} seconds and try again.`,
      values,
    };
  }

  // Never show the raw text of a server error to a visitor.
  if (response.status >= 500) {
    return {
      message:
        "Something went wrong on our side. Please try again in a moment.",
      values,
    };
  }

  return { message: response.message, values };
}

// _previous is the old state. useActionState always passes it first.
export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = text(formData, "name").trim();
  const email = text(formData, "email").trim();
  const password = text(formData, "password");
  const next = safeNextPath(text(formData, "next"));

  const response = await serverRequest<ApiData<AuthResult>>(
    "POST",
    "/auth/register",
    { body: { name, email, password, device_name: DEVICE_NAME } },
  );

  // The password is never sent back to the form.
  if (!response.ok) return failure(response, { name, email });

  const result = response.data.data;

  await setSessionToken(result.token, result.expires_at);
  // The header must show the new user, so the layout is rendered again.
  revalidatePath("/", "layout");

  redirect(next);
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = text(formData, "email").trim();
  const password = text(formData, "password");
  const next = safeNextPath(text(formData, "next"));

  const response = await serverRequest<ApiData<AuthResult>>(
    "POST",
    "/auth/login",
    { body: { email, password, device_name: DEVICE_NAME } },
  );

  if (!response.ok) return failure(response, { email });

  const result = response.data.data;

  await setSessionToken(result.token, result.expires_at);
  revalidatePath("/", "layout");

  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();

  if (token !== null) {
    // This deletes the token in Laravel. If it fails (an old token, Laravel
    // down) we still log the user out here, so we ignore the answer.
    await serverRequest<null>("POST", "/auth/logout", { token });
  }

  await clearSessionToken();
  revalidatePath("/", "layout");

  redirect("/");
}
