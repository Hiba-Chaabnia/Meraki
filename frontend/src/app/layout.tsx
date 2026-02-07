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
    { path: "./fonts/Chopard ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/Chopard ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "./fonts/Chopard Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Chopard LightItalic.ttf", weight: "300", style: "italic" },
    { path: "./fonts/Chopard Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Chopard RegularItalic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/Chopard Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Chopard MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "./fonts/Chopard SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Chopard SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "./fonts/Chopard Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Chopard BoldItalic.ttf", weight: "700", style: "italic" },
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
