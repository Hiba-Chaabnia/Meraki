"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

export default function AuthLayout({
  children,
  imageSrc,
  imageAlt = "Creative artwork",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Form column */}
      <div className="w-full lg:w-1/2 bg-[var(--background)] relative z-10 flex flex-col">
        {/* Centered form children + logo */}
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md"
          >
            {/* Logo — aligned with form content */}
            <div className="mb-4">
              <Link href="/" className="inline-block">
                <Image
                  src="/icons/logo/logo-colorful.svg"
                  alt="Meraki"
                  width={120}
                  height={40}
                  className="border-0"
                  priority
                />
              </Link>
            </div>
            {children}
          </motion.div>
        </div>
      </div>

      {/* Image panel (desktop only) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[var(--primary-medium)]">
        {imageSrc && (
          imageSrc.includes('.mp4') || imageSrc.includes('.webm') ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={imageSrc} />
            </video>
          ) : (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover h-full"
              priority
            />
          )
        )}
      </div>
    </div>
  );
}
