"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Home, PenLine, Medal, BarChart3, Heart, User, Settings, Compass, Menu, LogOut } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/dashboard/sessions", label: "Sessions", Icon: PenLine },
  { href: "/dashboard/challenges", label: "Challenges", Icon: Medal },
  { href: "/dashboard/progress", label: "Progress", Icon: BarChart3 },
  { href: "/dashboard/motivation", label: "Motivation", Icon: Heart },
];

const bottomItems = [
  { href: "/profile", label: "Profile", Icon: User },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useUser();

  const displayName = profile?.full_name || "You";
  const initial = displayName.charAt(0).toUpperCase();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/discover") return pathname.startsWith("/discover");
    if (href === "/profile") return pathname === "/profile";
    if (href === "/settings") return pathname === "/settings";
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const navLink = (item: (typeof navItems)[0], closeMobile?: boolean) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => closeMobile && setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          active
            ? "bg-[var(--secondary-light)] text-[var(--secondary)]"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }`}
      >
        <item.Icon className="w-5 h-5 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const userBadge = (closeMobile?: boolean) => (
    <div className="px-4 py-3 border-t border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--secondary)] to-[var(--coral)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initial}
        </div>
        <span className="text-sm font-medium text-gray-700 truncate">{displayName}</span>
      </div>
      <button
        onClick={() => {
          if (closeMobile) setMobileOpen(false);
          handleSignOut();
        }}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-56 flex-col border-r border-gray-100 bg-white z-30">
        {/* Logo */}
        <div className="px-6 py-5">
          <Link href="/" className="font-serif text-xl font-bold text-gray-900">
            Meraki
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => navLink(item))}
        </nav>

        {/* Explore link */}
        <nav className="px-3 py-3 border-t border-gray-100">
          {navLink({ href: "/discover", label: "Explore Hobbies", Icon: Compass })}
        </nav>

        {/* Bottom nav */}
        <nav className="px-3 pb-2 space-y-1 border-t border-gray-100 pt-4">
          {bottomItems.map((item) => navLink(item))}
        </nav>

        {/* User badge + sign out */}
        {userBadge()}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-30">
        <Link href="/" className="font-serif text-lg font-bold text-gray-900">
          Meraki
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-xl"
            >
              <div className="px-6 py-5 border-b border-gray-100">
                <Link href="/" className="font-serif text-xl font-bold text-gray-900">
                  Meraki
                </Link>
              </div>
              <nav className="flex-1 px-3 py-3 space-y-1">
                {navItems.map((item) => navLink(item, true))}
              </nav>
              <nav className="px-3 py-3 border-t border-gray-100">
                {navLink({ href: "/discover", label: "Explore Hobbies", Icon: Compass }, true)}
              </nav>
              <nav className="px-3 pb-2 space-y-1 border-t border-gray-100 pt-4">
                {bottomItems.map((item) => navLink(item, true))}
              </nav>
              {userBadge(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <main className="md:ml-56 min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
