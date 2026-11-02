// components/site/user-menu.tsx
// The login area of the header. A Server Component: it asks who is logged in.
// The header wraps it in <Suspense>.
//
// The logout button is a normal <form> with a Server Action. It works even
// without JavaScript.

import Link from "next/link";
import { FolderOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export async function UserMenu() {
  const user = await getCurrentUser();

  if (user === null) {
    return (
      <div className="flex items-center gap-2">
        {/* "Sign up" is hidden on small screens. The login page links to it. */}
        <div className="hidden sm:block">
          <Button asChild variant="ghost" size="sm">
            <Link href="/register">Sign up</Link>
          </Button>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* The name is typed by the user. React escapes it. */}
      <span className="hidden max-w-40 truncate text-sm sm:inline">
        {user.name}
      </span>

      {/* On small screens only the icon shows, so aria-label names the link. */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/my/builds" aria-label="My builds">
          <FolderOpen />
          <span className="hidden sm:inline">My builds</span>
        </Link>
      </Button>

      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm">
          <LogOut />
          Log out
        </Button>
      </form>
    </div>
  );
}
