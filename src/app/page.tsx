import { FloatingParticles } from "@/components/FloatingParticles";
import { HeroSection } from "@/components/HeroSection";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingParticles />
      <Navbar />
      <HeroSection />
    </div>
  );
}
