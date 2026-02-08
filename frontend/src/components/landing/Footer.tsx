"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Linkedin, MessageSquare, ExternalLink } from "lucide-react";
import { FlowerShape } from "../ui/FlowerShape";
import SectionBadge from "../ui/SectionBadge";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const LINKEDIN_URL = "https://www.linkedin.com/in/hiba-ch/";
  const FEEDBACK_URL = "https://forms.google.com/your-form-url";

  return (
    <footer className="p-3 md:p-2 sm:p-1 relative z-10 font-sans ">
      <div className="mx-auto flex flex-col gap-6 backdrop-blur-sm pt-4">

        {/* ROW 1: 2 Columns - Context & Connect */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 px-1">

          {/* Column 1: Context */}
          <div className="flex flex-col items-start gap-2">
            <SectionBadge
              label="Still Becoming"
              bgColor="var(--primary)" color="var(--primary-lighter)"
              className="!px-4 !py-1.5"
              flowerSize={14}
              textClassName="text-xs font-bold italic tracking-widest"
            />

            <div className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed max-w-md pt-2">
                Built as part of <span className="font-semibold text-gray-900 italic">Commit To Change</span> hackathon, sponsored by:
              </p>
              <div className="flex items-center gap-6 opacity-80 mix-blend-multiply">
                <Image
                  src="/icons/hackathon-sponsers/opik.png"
                  alt="Opik"
                  width={70}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
                <Image
                  src="/icons/hackathon-sponsers/google-deepmind.png"
                  alt="Google DeepMind"
                  width={110}
                  height={24}
                  className="h-5 w-auto object-contain"
                />
                <Image
                  src="/icons/hackathon-sponsers/vercel.png"
                  alt="Vercel"
                  width={80}
                  height={24}
                  className="h-4 w-auto object-contain"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <p className="text-gray-600 text-sm tracking-wider">Early Version. Best experienced on desktop for now.</p>
            </div>
          </div>

          {/* Column 2: Connect */}
          <div className="flex flex-col items-end gap-2 text-right">
            <SectionBadge
              label="Shape What Becomes"
              bgColor="var(--primary-lighter)" color="var(--primary)"
              className="!px-4 !py-1.5"
              flowerSize={14}
              textClassName="text-xs font-bold italic tracking-widest text-[var(--secondary)]"
            />

            <div className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed max-w-md pt-2">
                Your experience and perspective is part of the process.
              </p>
              <div className="flex items-center justify-end gap-6 opacity-80 mix-blend-multiply pr-0.5">
                <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
                  <img src="/icons/media/linkedin.png" alt="LinkedIn" className="h-6 w-auto cursor-pointer" height={24} />
                </a>
                
                <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
                  <img src="/icons/media/google-forms.png" alt="Google Forms" className="h-6 w-auto cursor-pointer" height={24} />
                </a>
                
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <p className="text-gray-600 text-sm tracking-wider">We value your feedback. </p>
            </div>

          </div>
        </div>

        {/* ROW 2: Full Width Wordmark */}
        <div className="w-full flex justify-center opacity-90 hover:opacity-100 transition-opacity ">
          <Image
            src="/icons/logo/wordmark-colorful.svg"
            alt="Meraki"
            width={800}
            height={200}
            className="w-full h-auto object-contain select-none"
          />
        </div>

        {/* ROW 3: Bottom Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-xs text-gray-400 tracking-wide font-medium px-1">

          {/* Col 1: Copyright */}
          <div className="text-center md:text-left">
            &copy; {currentYear} Meraki. All Rights Reserved.
          </div>

          {/* Col 2: Links */}
          <div className="flex justify-center items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <FlowerShape color="var(--secondary-light)" size={16} />
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
          </div>

          {/* Col 3: Built with Love */}
          <div className="flex items-center justify-center md:justify-end gap-1.5 text-center md:text-right normal-case">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 fill-[var(--secondary)] text-[var(--secondary)]" />
            <span>to help creatives discover.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
