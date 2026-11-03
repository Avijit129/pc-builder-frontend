"use server";

// lib/actions/builds.ts
// Server Actions for saving builds. They run on the server, read the token
// from the cookie and call Laravel (POST or PATCH /api/my/builds).
//
// A Server Action can be called by anyone, so we never trust the input.
// Laravel still checks every rule (limits, active parts, ...). Here we only
// make sure the data has the right SHAPE and that the slug is safe to put
// into a URL.

import { revalidatePath } from "next/cache";
import { serverRequest, type FailedResponse } from "@/lib/api-server";
import { isValidSlug } from "@/lib/get-component";
import { getSessionToken } from "@/lib/session";
import type {
  ApiData,
  ComponentType,
  DeleteBuildResult,
  MyBuild,
  SaveBuildBody,
  SaveBuildInput,
  SaveBuildResult,
  VisibilityResult,
} from "@/lib/types";

type Parts = NonNullable<SaveBuildBody["parts"]>;

// Returns null when the list does not have the right shape.
function cleanParts(value: unknown): Parts | null {
  if (!Array.isArray(value)) return null;

  const parts: Parts = [];

  for (const row of value) {
    if (row === null || typeof row !== "object") return null;

    const { type, component_id, quantity } = row as Record<string, unknown>;

    if (
      typeof type !== "string" ||
      typeof component_id !== "number" ||
      typeof quantity !== "number"
    ) {
      return null;
    }

    parts.push({ type: type as ComponentType, component_id, quantity });
  }

  return parts;
}

// Turns an error answer from Laravel into one message for the save panel.
function failure(
  response: FailedResponse,
): Extract<SaveBuildResult, { status: "error" }> {
  if (response.status === 404) {
    return {
      status: "error",
      notFound: true,
      message:
        "We could not find this saved build. It may have been deleted. Press Save build to make a new one.",
    };
  }

  if (response.status === 422 && response.errors) {
    // The first message of the first field. Laravel writes it for the user.
    const first = Object.values(response.errors)[0]?.[0];

    return { status: "error", message: first ?? response.message };
  }

  if (response.status === 429) {
    return {
      status: "error",
      message:
        response.retryAfter === null
          ? "Too many requests. Please wait a moment and try again."
          : `Too many requests. Please wait ${response.retryAfter} seconds and try again.`,
    };
  }

  // Never show the raw text of a server error to a visitor.
  if (response.status >= 500) {
    return {
      status: "error",
      message:
        "Something went wrong on our side. Please try again in a moment.",
    };
  }

  // Includes status 0 ("Could not reach the server..."), which is already friendly.
  return { status: "error", message: response.message };
}

export async function saveBuildAction(
  input: SaveBuildInput,
): Promise<SaveBuildResult> {
  const token = await getSessionToken();

  // Not logged in. The browser keeps the build and sends the user to /login.
  if (token === null) return { status: "needs_login" };

  const parts = cleanParts(input.parts);

  if (parts === null || parts.length === 0) {
    return {
      status: "error",
      message: "Choose at least one part before you save.",
    };
  }

  const slug = typeof input.slug === "string" ? input.slug : null;

  // The slug goes into the URL, so it must look like a slug.
  if (slug !== null && !isValidSlug(slug)) {
    return {
      status: "error",
      message: "This saved build is not valid. Please refresh the page.",
    };
  }

  const name =
    typeof input.name === "string" ? input.name.trim().slice(0, 100) : "";

  // No description and no is_public: on a PATCH they stay as they are, and a
  // new build is private by default (API reference, section 9).
  const body: SaveBuildBody = { name: name === "" ? null : name, parts };

  // PATCH replaces ALL parts of the saved build with this list.
  const response =
    slug === null
      ? await serverRequest<ApiData<MyBuild>>("POST", "/my/builds", {
          body,
          token,
        })
      : await serverRequest<ApiData<MyBuild>>("PATCH", `/my/builds/${slug}`, {
          body,
          token,
        });

  if (response.ok) {
    // "My builds" shows the part count and the "Updated" date, so Next.js
    // must load that page again the next time the user opens it.
    revalidatePath("/my/builds");

    return {
      status: "saved",
      slug: response.data.data.slug,
      updated: slug !== null,
    };
  }

  // An expired or deleted token. Same as "not logged in".
  if (response.status === 401) return { status: "needs_login" };

  return failure(response);
}

export async function deleteBuildAction(
  slug: string,
): Promise<DeleteBuildResult> {
  const token = await getSessionToken();

  if (token === null) return { status: "needs_login" };

  // The slug goes into the URL, so it must look like a slug.
  if (typeof slug !== "string" || !isValidSlug(slug)) {
    return {
      status: "error",
      message: "This build is not valid. Please refresh the page.",
    };
  }

  const response = await serverRequest<null>("DELETE", `/my/builds/${slug}`, {
    token,
  });

  // 404 means the build is already gone (for example deleted in another tab).
  // That is what the user wanted, so it counts as deleted.
  if (response.ok || response.status === 404) {
    // Makes Next.js load the list again, without the deleted build.
    revalidatePath("/my/builds");

    return { status: "deleted" };
  }

  if (response.status === 401) return { status: "needs_login" };

  return { status: "error", message: failure(response).message };
}

export async function setBuildVisibilityAction(
  slug: string,
  isPublic: boolean,
): Promise<VisibilityResult> {
  const token = await getSessionToken();

  if (token === null) return { status: "needs_login" };

  // A Server Action can be called by anyone, so we check the input first.
  // The slug goes into the URL, so it must look like a slug.
  if (
    typeof slug !== "string" ||
    !isValidSlug(slug) ||
    typeof isPublic !== "boolean"
  ) {
    return {
      status: "error",
      message: "This build is not valid. Please refresh the page.",
    };
  }

  // Only is_public. On a PATCH, the name and the parts stay as they are
  // (API reference, section 9: "Send only what changes").
  const body: SaveBuildBody = { is_public: isPublic };

  const response = await serverRequest<ApiData<MyBuild>>(
    "PATCH",
    `/my/builds/${slug}`,
    { body, token },
  );

  if (response.ok) {
    // Load the list again, so the badge and the share link are right.
    revalidatePath("/my/builds");
    // The public page is cached. This asks Next.js to load it again, so it
    // shows (or hides) the build soon. Laravel is still the real gate: a
    // private build always answers 404.
    revalidatePath(`/builds/${slug}`);

    return { status: "updated" };
  }

  if (response.status === 401) return { status: "needs_login" };

  if (response.status === 404) {
    // The build is gone (for example deleted in another tab).
    revalidatePath("/my/builds");

    return {
      status: "error",
      message: "This build no longer exists. The list was updated.",
    };
  }

  return { status: "error", message: failure(response).message };
}
