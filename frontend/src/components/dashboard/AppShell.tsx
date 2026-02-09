"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { displayName } from "@/lib/displayName";
import { UserChip } from "./UserChip";

/**
 * The page shell: background, padding, and one header row.
 *
 * Replaces `DashboardNav`, whose sidebar and bottom tab bar navigated between
 * five routes that are now two. A tab bar for a two-level hierarchy — hobbies,
 * then one hobby — is chrome around a back link.
 *
 * The header is not decoration. `DashboardNav` was the only route to Profile,
 * Settings and sign-out (via `UserChip`), and the only route to `/discover` for
 * anyone who already had hobbies: the two in-app links to the quiz live in the
 * new-user empty state and the all-paused state, neither of which an established
 * user ever sees. Both of those hang off this row.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, signOut } = useUser();

  const name = displayName(user, profile) || "—";

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--white-muted)] bg-[var(--background)]/90 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 md:h-16 md:px-8">
          <Link href="/dashboard" aria-label="Hobbies">
            <Image
              src="/icons/logo/logo-colorful.png"
              alt="Meraki"
              width={90}
              height={28}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-1.5">
            <Link
              href="/discover"
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-[var(--white-muted)] hover:text-gray-900"
            >
              <Compass className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Discover</span>
            </Link>
            <div className="w-8 md:w-auto">
              <UserChip
                displayName={name}
                displayInitial={name.charAt(0).toUpperCase()}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
