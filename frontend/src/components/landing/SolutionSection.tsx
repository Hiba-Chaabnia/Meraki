"use client";

import { useRef } from "react";
import { useScroll } from "framer-motion";
import StickyCardStack from "@/components/ui/StickyCardStack";
import SectionBadge from "@/components/ui/SectionBadge";
import HeroIconPattern from "@/components/HeroIconPattern";

const steps = [
  {
    id: "match",
    color: "#5396F4",
    icon: "✨",
    title: "A fit that feels right",
    description:
      "We match you with a craft that fits your energy and your day, creating a dedicated space for you to breathe.",
  },
  {
    id: "entry",
    color: "#CFE251",
    icon: "🌱",
    title: "The beauty of small starts",
    description:
      "Manageable first steps designed so you can skip the overwhelm and focus on the simple wonder of creating.",
  },
  {
    id: "habit",
    color: "#FFD64D",
    icon: "🧤",
    title: "A gentle nudge",
    description:
      "Soft reminders to return to your craft and celebrating every small moment you choose to show up.",
  },
  {
    id: "growth",
    color: "#FF9149",
    icon: "☀️",
    title: "Bloom as you go",
    description:
      "There are no finish lines here. Discover new depths in your craft only when you feel ready for more.",
  },
  {
    id: "cta",
    color: "#292929",
    icon: "❤️",
    title: "Ready to start your creative journey?",
    description:
      "Join us and find the quiet joy of creating something with your own two hands.",
    isCTA: true,
  },
];

export default function SolutionSection() {
  const containerRef = useRef(null);

  // Track page scroll for the entire section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div className="relative bg-[var(--background)]">
      {/* 1. The Outer Container - Increased to 500vh to accommodate the 5th card */}
      <div ref={containerRef} className="relative h-[500vh] w-full">
        {/* 2. The Sticky Wrapper */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
          <div className="w-full h-screen p-3 md:p-2 sm:p-1 relative">

            {/* 3. The Scallop Window Content Grid */}
            <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden scallop-xl scallop-mask-y bg-[var(--secondary)]">
              {/* Icon wallpaper pattern */}
              <HeroIconPattern useMask={false} iconSet="secondary" iconOpacity={0.5} />

              {/* Left Column (Stationary) */}
              <div className="relative z-10 w-full md:w-1/2 flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16 md:py-0">
                <div className="flex justify-start mb-10">
                  <SectionBadge label="The Meraki Way" />
                </div>
                <h2 className="max-w-md mb-6">
                  A kinder way to find <em>your</em> creative calling
                </h2>
                <p className="text-xl font-semibold leading-snug max-w-md" style={{ color: "var(--foreground)" }}>
                  Creativity isn’t a race. We’re here to make sure your creative
                  path is always encouraging.
                </p>
              </div>

              {/* Right Column (Cards Stacking via Scroll) */}
              <div className="w-full md:w-1/2 h-full relative p-8 md:p-16 flex items-center justify-center border border-blue-500">
                <StickyCardStack
                  steps={steps}
                  scrollYProgress={scrollYProgress}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
