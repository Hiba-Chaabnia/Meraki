"use client";

import { FlowerShape } from "@/components/ui/FlowerShape";
import { ReactNode, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface StepCardProps {
  /** The icon to display inside the flower */
  icon: ReactNode | string;
  /** The color theme for the flower */
  color: string;
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Whether this is a Call to Action card */
  isCTA?: boolean;
}

export default function StepCard({
  icon,
  color,
  title,
  description,
  isCTA = false,
}: StepCardProps) {
  // We use index-based gradients in the original snippet, or we can just generate a unique-ish ID or pass it in.
  // For simplicity, we'll generate a gradient ID based on the title or random.
  // Ideally, the parent should pass a unique ID, but we can rely on standard SVG behavior or just random strings if needed.
  // Let's assume the parent might pass it, or we generate one.
  const gradientId = `grad-${title.replace(/\s+/g, "-").toLowerCase()}`;

  const isImagePath = typeof icon === "string" && icon.startsWith("/");

  return (
    <div className="flex flex-col items-center text-center h-full justify-start">
      {/* Flower + Icon Wrapper */}
      <div className="relative flex items-center justify-center mb-4 md:mb-6">
        <FlowerShape color={color} gradientId={gradientId} size={120} />
        {/* Icon positioned absolutely over the flower */}
        <div className="absolute inset-0 flex items-center justify-center text-white text-4xl drop-shadow-md z-10">
          {isImagePath ? (
            <Image
              src={icon as string}
              alt={title || "Step icon"}
              width={64}
              height={64}
              className="object-contain"
            />
          ) : (
            icon
          )}
        </div>
      </div>

      <p
        className={`text-xl font-semibold leading-snug mb-2 md:mb-4 text-gray-900 font-mulish ${isCTA ? "mt-4" : ""
          }`}
      >
        {title}
      </p>

      <p className="text-base font-medium leading-snug mb-4 md:mb-8 text-gray-700">
        {description.split(/<br\s*\/?>/i).map((line, i, arr) => (
          <Fragment key={i}>
            {line}
            {i !== arr.length - 1 && <br />}
          </Fragment>
        ))}
      </p>

      {isCTA && (
        <motion.div
          animate={{ rotate: [0, -3, 3, -2, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
          whileHover={{ rotate: 0, scale: 1.05 }}
        >
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 rounded-xl font-semibold text-[var(--background)] bg-[var(--primary)] transition-shadow hover:shadow-lg text-base no-underline"
          >
            Begin your journey
          </Link>
        </motion.div>
      )}
    </div>
  );
}
