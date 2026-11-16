import { useState } from "react";
import ScrollPlayhead from "../components/landing/ScrollPlayhead.jsx";
import LandingNavbar from "../components/landing/LandingNavbar.jsx";
import Hero from "../components/landing/hero/Hero.jsx";
import ComparisonSection from "../components/landing/sections/ComparisonSection.jsx";
import WorkflowSection from "../components/landing/sections/WorkflowSection.jsx";
import FeaturesSection from "../components/landing/features/FeaturesSection.jsx";
import SpecsStrip from "../components/landing/sections/SpecsStrip.jsx";
import FaqSection from "../components/landing/sections/FaqSection.jsx";
import FinalCta from "../components/landing/sections/FinalCta.jsx";
import LandingFooter from "../components/landing/LandingFooter.jsx";

export default function LandingPage() {
  const [activeMood, setActiveMood] = useState("Funny");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070708] font-['Inter',sans-serif] leading-[1.55] text-[#f4f4f5] antialiased [&_a]:text-inherit [&_a]:no-underline [&_button]:cursor-pointer motion-reduce:[&_*]:![transition-duration:0.01ms]">
      <ScrollPlayhead />
      <LandingNavbar />
      <Hero activeMood={activeMood} onSelectMood={setActiveMood} />
      <ComparisonSection />
      <WorkflowSection />
      <FeaturesSection activeMood={activeMood} />
      <SpecsStrip />
      <FaqSection />
      <FinalCta />
      <LandingFooter />
    </div>
  );
}
