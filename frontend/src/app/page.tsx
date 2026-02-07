import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <Footer />
    </div>
  );
}
