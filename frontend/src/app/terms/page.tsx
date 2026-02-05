import { LegalPage } from "@/components/legal/LegalPage";
import { TERMS } from "@/lib/legal";

export const metadata = {
  title: "Terms of Service — Meraki",
  description: "Terms of Service for Meraki creative hobby platform",
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}
