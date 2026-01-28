"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDownIcon } from "@/components/ui/Icons";
import { type LocalExperiencesResult } from "@/app/actions/sampling";

interface GeneralTipsProps {
  tips: NonNullable<LocalExperiencesResult["general_tips"]>;
}

const TIP_ITEMS: { key: keyof NonNullable<LocalExperiencesResult["general_tips"]>; label: string }[] = [
  { key: "what_to_wear", label: "What to wear" },
  { key: "what_to_bring", label: "What to bring" },
  { key: "what_to_expect", label: "What to expect" },
  { key: "how_to_not_feel_awkward", label: "Don\u2019t feel awkward" },
];

export function GeneralTips({ tips }: GeneralTipsProps) {
  const [openItem, setOpenItem] = useState<string | null>("what_to_wear");

  const toggle = (key: string) =>
    setOpenItem((prev) => (prev === key ? null : key));

  const visibleItems = TIP_ITEMS.filter((item) => tips[item.key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-2 mb-6"
    >
      <p className="text-md font-semibold tracking-widest text-gray-500 mb-4">
        Tips for your first visit
      </p>
      <div>
        {visibleItems.map((item, idx) => (
          <div
            key={item.key}
            className={idx < visibleItems.length - 1 ? "border-b border-gray-100" : ""}
          >
            <button
              onClick={() => toggle(item.key)}
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform ${openItem === item.key ? "rotate-180" : ""}`}
              />
            </button>
            {openItem === item.key && (
              <p className="text-sm text-gray-500 pb-3">{tips[item.key]}</p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
