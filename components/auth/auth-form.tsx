"use client";

// components/auth/auth-form.tsx
// The login and register form. It is a Client Component for useActionState,
// which gives us three things: the answer of the Server Action (state), the
// action to put on the <form>, and "pending" (true while the call runs).
//
// React 19 EMPTIES a form after its action finishes. That would delete the
// email after a wrong password. So the action sends back what was typed (never
// the password) and we use it as defaultValue.

import { useActionState, useId } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loginAction, registerAction } from "@/lib/actions/auth";
import type { AuthFormState } from "@/lib/types";

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

const initialState: AuthFormState = {};

type Props = {
  mode: "login" | "register";
  /** A safe path (see lib/safe-redirect.ts). Where to go after success. */
  next: string;
};

// "/login" or "/login?next=%2Fbuilder". The default "/" is left out.
function authHref(path: string, next: string): string {
  return next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`;
}

export function AuthForm({ mode, next }: Props) {
  const isRegister = mode === "register";

  const [state, formAction, pending] = useActionState(
    isRegister ? registerAction : loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {/* Tells the action where to go after success. It checks it again. */}
      <input type="hidden" name="next" value={next} />

      {state.message && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 p-3 text-sm"
        >
          {state.message}
        </p>
      )}

      {isRegister && (
        <Field
          name="name"
          label="Name"
          type="text"
          autoComplete="name"
          maxLength={100}
          defaultValue={state.values?.name}
          error={state.errors?.name?.[0]}
        />
      )}

      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        maxLength={255}
        defaultValue={state.values?.email}
        error={state.errors?.email?.[0]}
      />

      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        maxLength={255}
        error={state.errors?.password?.[0]}
        hint={
          isRegister
            ? "Tip: use at least 12 characters, with capital and small letters, numbers and symbols."
            : undefined
        }
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? isRegister
            ? "Creating account…"
            : "Logging in…"
          : isRegister
            ? "Create account"
            : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link
              href={authHref("/login", next)}
              className="text-foreground underline underline-offset-4"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href={authHref("/register", next)}
              className="text-foreground underline underline-offset-4"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  maxLength: number;
  defaultValue?: string;
  error?: string;
  hint?: string;
};

function Field({
  name,
  label,
  type,
  autoComplete,
  maxLength,
  defaultValue,
  error,
  hint,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Screen readers read the error and the hint together with the field.
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={fieldClass}
      />

      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
