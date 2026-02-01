import type { Metadata } from "next";
import { EB_Garamond, Alegreya, Mulish } from "next/font/google";
import localFont from "next/font/local";
import { UserProvider } from "@/lib/providers/UserProvider";
import { FlowerCursor } from "@/components/ui/FlowerCursor";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
});

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
});

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
});

const chopard = localFont({
  src: [
    { path: "./fonts/Chopard Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Chopard MediumItalic.ttf", weight: "500", style: "italic" },
  ],
  variable: "--font-chopard",
});

export const metadata: Metadata = {
  title: "Meraki — Make Art You'll Fall In Love With Making",
  description:
    "Discover and develop creative hobbies through guided pathways, challenges, and AI-powered feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ebGaramond.variable} ${alegreya.variable} ${mulish.variable} ${chopard.variable} antialiased`}
      >
        <FlowerCursor />
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
