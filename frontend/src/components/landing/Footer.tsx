"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Brand */}
        <div className="text-center">
          <Link
            href="/"
            className="text-2xl font-serif font-bold text-[var(--foreground)] no-underline"
          >
            Meraki
          </Link>
          <p className="text-sm text-gray-400 mt-3 leading-relaxed max-w-md mx-auto">
            Discover and develop creative hobbies through guided pathways,
            challenges, and encouragement.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Meraki. Made with
            <Heart className="w-3 h-3 inline mx-1 text-[var(--coral)]" />
            for creatives everywhere.
          </p>
          <p className="text-xs text-gray-400">
            It doesn&apos;t have to be perfect — it just has to be yours.
          </p>
        </div>
      </div>
    </footer>
  );
}
