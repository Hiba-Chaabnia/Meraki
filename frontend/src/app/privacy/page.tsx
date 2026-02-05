import { LegalPage } from "@/components/legal/LegalPage";
import { PRIVACY } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy — Meraki",
  description: "Privacy Policy for Meraki creative hobby platform",
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
