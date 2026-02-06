"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Home, BarChart3, Compass, Menu, PanelLeft, Trophy, Map } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { NavItem, type NavItemConfig } from "./NavItem";
import { UserChip } from "./UserChip";
import { springModal } from "@/components/ui/animations";

const navItems: NavItemConfig[] = [
  { href: "/dashboard", label: "Hobbies", mobileLabel: "Hobbies", Icon: Home },
  { href: "/discover", label: "Discover", Icon: Compass },
  { href: "/dashboard/challenges", label: "Challenges", Icon: Trophy },
  { href: "/dashboard/roadmap", label: "Roadmap", Icon: Map },
  { href: "/dashboard/progress", label: "Progress", Icon: BarChart3 },
];

interface DashboardNavProps {
  children: React.ReactNode;
  openWidthVw?: number;
  closedWidthVw?: number;
  /** Height of the header (logo/toggle row) in px. Default: 64 */
  headerHeight?: number;
  /** Height of the footer (user chip row) in px. Default: 64 */
  footerHeight?: number;
}

export function DashboardNav({
  children,
  openWidthVw = 14,
  closedWidthVw = 4,
  headerHeight = 64,
  footerHeight = 64,
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [isMd, setIsMd] = useState(false);
  const { user, profile, signOut } = useUser();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "—";
  const displayInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const check = () => setIsMd(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const currentSidebarW = desktopOpen ? `${openWidthVw}vw` : `${closedWidthVw}vw`;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/discover") return pathname.startsWith("/discover");
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex">

      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex fixed top-0 left-0 bottom-0 flex-col bg-[var(--background)] border-r border-[var(--white-muted)] z-30 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ width: currentSidebarW, minWidth: desktopOpen ? undefined : "52px" }}
      >
        <div className="flex flex-col h-full">

          {/* Header — logo + collapse toggle */}
          <div className="flex-shrink-0 flex items-center overflow-hidden" style={{ height: headerHeight }}>
            {desktopOpen ? (
              <div className="flex items-center justify-between w-full px-4">
                <div className="h-8 flex items-center">
                  <Image
                    src="/icons/logo/logo-colorful.png"
                    alt="Meraki"
                    width={90}
                    height={28}
                    className="h-full w-auto object-contain"
                    priority
                  />
                </div>
                <button
                  onClick={() => setDesktopOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-[var(--white-muted)] transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeft className="w-[18px] h-[18px]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <button
                  onClick={() => setDesktopOpen(true)}
                  title="Open sidebar"
                  aria-label="Open sidebar"
                  className="group/toggle relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--white-muted)] transition-colors cursor-pointer"
                >
                  <Image
                    src="/icons/logo/favicon-colorful.png"
                    alt="Meraki"
                    width={22}
                    height={22}
                    className="w-full h-full object-contain transition-opacity duration-150 group-hover/toggle:opacity-0"
                  />
                  <PanelLeft className="w-[18px] h-[18px] text-gray-500 absolute inset-0 m-auto opacity-0 group-hover/toggle:opacity-100 transition-opacity duration-150" />
                </button>
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav className={`flex-1 py-3 overflow-y-auto overflow-x-hidden hide-scrollbar space-y-0.5 ${desktopOpen ? "px-3" : "px-1.5"}`}>
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={!desktopOpen}
              />
            ))}
          </nav>

          {/* User chip */}
          <div
            className={`flex-shrink-0 flex items-center ${desktopOpen ? "px-3" : "px-1.5 justify-center"}`}
            style={{ height: footerHeight }}
          >
            <UserChip
              displayName={displayName}
              displayInitial={displayInitial}
              expanded={desktopOpen}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--white-muted)] flex items-center justify-between px-4 z-30">
        <Link href="/">
          <Image src="/icons/logo/logo-colorful.png" alt="Meraki" width={80} height={26} className="h-7 w-auto object-contain" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 rounded-xl hover:bg-[var(--white-muted)] flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={springModal}
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-[var(--background)] z-50 flex flex-col shadow-2xl"
            >
              <div className="flex flex-col h-full">
                <div className="h-16 flex items-center px-5 border-b border-[var(--white-muted)] flex-shrink-0">
                  <Link href="/">
                    <Image src="/icons/logo/logo-colorful.png" alt="Meraki" width={90} height={28} className="h-7 w-auto object-contain" />
                  </Link>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                  {navItems.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      active={isActive(item.href)}
                      mobile
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>
                <div className="border-t border-[var(--white-muted)] px-3 py-4 flex-shrink-0">
                  <UserChip
                    displayName={displayName}
                    displayInitial={displayInitial}
                    expanded
                    onSignOut={handleSignOut}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <main
        className="flex-1 min-h-screen pt-14 pb-20 md:pt-0 md:pb-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={isMd ? { paddingLeft: currentSidebarW } : undefined}
      >
        <div className="p-4 md:p-8 h-full">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--white-muted)] z-30 flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-6 transition-colors ${active ? "text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
            >
              <item.Icon className={`w-5 h-5 transition-transform duration-200 ${active ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium">{item.mobileLabel ?? item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
