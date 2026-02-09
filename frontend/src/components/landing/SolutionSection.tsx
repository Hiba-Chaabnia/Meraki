"use client";

import { useRef } from "react";
import { useScroll } from "framer-motion";
import StickyCardStack from "@/components/ui/landing/solution-section/StickyCardStack";
import SectionBadge from "@/components/ui/SectionBadge";
import HeroIconPattern from "@/components/ui/HeroIconPattern";

const steps = [
  {
    id: "match",
    color: "var(--primary)",
    icon: "/icons/solution/card1.png",
    title: "A fit that feels right",
    description:
      "We match you with a craft<br/>that fits your energy and your day,<br/>creating a dedicated space for you to breathe.",
  },
  {
    id: "entry",
    color: "var(--primary)",
    icon: "/icons/solution/card2.png",
    title: "The beauty of small starts",
    description:
      "Manageable first steps designed so<br/>you can skip the overwhelm and<br/>focus on the simple wonder of creating.",
  },
  {
    id: "habit",
    color: "var(--primary)",
    icon: "/icons/solution/card3.png",
    title: "A gentle nudge",
    description:
      "Soft reminders to return to your craft<br/>and celebrating every small moment<br/>you choose to show up.",
  },
  {
    id: "growth",
    color: "var(--primary)",
    icon: "/icons/solution/card4.png",
    title: "Bloom as you go",
    description:
      "There are no finish lines here.<br/>Discover new depths in your craft<br/>only when you feel ready for more.",
  },
  {
    id: "cta",
    color: "var(--primary)",
    icon: "/icons/solution/card5.png",
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
              <div className="relative z-10 w-full shrink-0 md:shrink md:w-7/12 flex flex-col justify-center px-6 py-8 md:px-16 md:py-0">
                <div className="flex justify-center mb-6 md:mb-10 ">
                  <SectionBadge label="The Meraki Way" bgColor="var(--primary-lighter)" color="var(--primary)" />
                </div>
                <h2 className="mb-6 md:mb-10 text-center">
                  A <em>kinder way</em> to find<br />your <em>creative calling</em><br />— and <em>stick to it</em>
                </h2>
                <p className="text-lg md:text-xl font-semibold leading-snug text-center" style={{ color: "var(--foreground)" }}>
                  We gently helps you <br />try, grow, and commit to what feels right <br />with a calm, guided path of small steps<br />you’ll actually want to return to.
                </p>
              </div>

              {/* Right Column (Cards Stacking via Scroll) */}
              <div className="w-full flex-1 md:w-5/12 md:h-full relative p-4 md:p-16 flex items-center justify-center">
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
