"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface ProblemCardProps {
  text: string;
  image: string;
  bgColor: string;
  /** Position of text relative to image. Defaults to "top" */
  textPosition?: "top" | "bottom";
  /** Color of the card text */
  textColor?: string;
  /** Direction of tilt on hover */
  tiltDirection?: "left" | "right" | "none";
}

export default function ProblemCard({
  text,
  image,
  bgColor,
  textColor = "var(--foreground)",
  textPosition = "top",
  tiltDirection = "none",
}: ProblemCardProps) {
  // Tilt angle in degrees
  const tiltDegree = 3;

  const getTiltRotation = () => {
    switch (tiltDirection) {
      case "left":
        return -tiltDegree;
      case "right":
        return tiltDegree;
      default:
        return 0;
    }
  };

  const textSection = (
    <div className="px-6 py-6 text-center">
      <p
        className="text-xl font-semibold leading-snug"
        style={{ color: textColor }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );

  const imageSection = (
    <div className="relative flex-1 overflow-hidden">
      <div className="relative w-full h-full">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
    </div>
  );

  return (
    <motion.div
      className="group relative cursor-pointer"
      initial={{ rotate: 0 }}
      whileHover={{ rotate: getTiltRotation() }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className="relative h-[430px] md:h-[460px] flex flex-col rounded-2xl overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {textPosition === "top" ? (
          <>
            {textSection}
            {imageSection}
          </>
        ) : (
          <>
            {imageSection}
            {textSection}
          </>
        )}
      </div>
    </motion.div>
  );
}
