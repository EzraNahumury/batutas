import StarField from "./components/StarField";
import ScrollReveal from "./components/ScrollReveal";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Intro from "./components/Intro";
import Features from "./components/Features";
import Economy from "./components/Economy";
import HowItWorks from "./components/HowItWorks";
import Fairness from "./components/Fairness";
import Roadmap from "./components/Roadmap";
import TechStack from "./components/TechStack";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <StarField />
      <ScrollReveal />
      <main className="frame">
        <Navbar />
        <Hero />
        <Intro />
        <Features />
        <Economy />
        <HowItWorks />
        <Fairness />
        <Roadmap />
        <TechStack />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
