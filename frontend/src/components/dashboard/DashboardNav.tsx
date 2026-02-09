"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Home, PenLine, Medal, BarChart3, User, Settings, Compass, Menu, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/dashboard/sessions", label: "Sessions", Icon: PenLine },
  { href: "/dashboard/challenges", label: "Challenges", Icon: Medal },
  { href: "/dashboard/progress", label: "Progress", Icon: BarChart3 },
];

const bottomItems = [
  { href: "/profile", label: "Profile", Icon: User },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
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
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${active
          ? "bg-[var(--secondary-light)] text-[var(--secondary)] shadow-sm"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
          } ${!desktopOpen && !closeMobile ? "justify-center px-2" : ""}`}
      >
        <item.Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`} />
        <span className={`transition-all duration-200 ${!desktopOpen && !closeMobile ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"}`}>
          {item.label}
        </span>
      </Link>
    );
  };



  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* ── Desktop Drawer (Floating Sidebar) ── */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 bottom-0 flex-col bg-white border-r border-gray-100 z-30 overflow-hidden transition-all duration-500 ease-[bezier(0.25,1,0.5,1)] ${desktopOpen ? "w-72" : "w-24"
          }`}
      >
        {/* Decorative background blur/gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50/50 pointer-events-none" />

        <div className="relative flex flex-col h-full">
          {/* Logo & Close Button */}
          <div className={`py-8 flex items-center transition-all duration-500 ${desktopOpen ? "px-8 justify-between" : "px-4 flex-col gap-4 justify-center"}`}>
            <Link href="/" className={`block transition-all duration-500 ${desktopOpen ? "opacity-100 scale-100" : "opacity-0 scale-0 w-0 h-0 overflow-hidden"}`}>
              <Image
                src="/icons/logo/logo-colorful.png"
                alt="Meraki"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
            <button
              onClick={() => setDesktopOpen(!desktopOpen)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label={desktopOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {desktopOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Main nav */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
            <div className={`px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-opacity duration-200 ${!desktopOpen ? "opacity-0 h-0 overflow-hidden py-0" : "opacity-100"}`}>
              Menu
            </div>
            {navItems.map((item) => navLink(item))}

            <div className="h-6" /> {/* Spacer */}

            <div className={`px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-opacity duration-200 ${!desktopOpen ? "opacity-0 h-0 overflow-hidden py-0" : "opacity-100"}`}>
              Discover
            </div>
            {navLink({ href: "/discover", label: "Explore Hobbies", Icon: Compass })}

            <div className="h-6" /> {/* Spacer */}

            <div className={`px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-opacity duration-200 ${!desktopOpen ? "opacity-0 h-0 overflow-hidden py-0" : "opacity-100"}`}>
              Account
            </div>
            {bottomItems.map((item) => navLink(item))}
            <button
              onClick={() => handleSignOut()}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all duration-200 group ${!desktopOpen ? "justify-center px-2" : ""}`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className={`transition-all duration-200 ${!desktopOpen ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"}`}>Sign Out</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* ── Desktop Open Button (Visible when closed) ── */}


      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 z-30 shadow-sm">
        <Link href="/" className="block">
          <Image
            src="/icons/logo/logo-colorful.png"
            alt="Meraki"
            width={100}
            height={32}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
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
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-80 bg-white z-50 flex flex-col shadow-2xl"
            >
              <div className="relative flex flex-col h-full">
                <div className="px-8 py-6 border-b border-gray-100">
                  <Link href="/" className="block">
                    <Image
                      src="/icons/logo/logo-colorful.png"
                      alt="Meraki"
                      width={120}
                      height={40}
                      className="h-10 w-auto object-contain"
                    />
                  </Link>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
                  {navItems.map((item) => navLink(item, true))}

                  <div className="h-6" />

                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Discover</div>
                  {navLink({ href: "/discover", label: "Explore Hobbies", Icon: Compass }, true)}

                  <div className="h-6" />

                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</div>
                  {bottomItems.map((item) => navLink(item, true))}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all duration-200 group"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <main
        className={`flex-1 min-h-screen pt-20 md:pt-6 p-4 md:p-6 transition-all duration-500 ease-[bezier(0.25,1,0.5,1)] ${desktopOpen ? "md:pl-80" : "md:pl-32"
          }`}
      >
        {children}
      </main>
    </div>
  );
}
