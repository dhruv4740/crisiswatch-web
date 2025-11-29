import {
  Navbar,
  Hero,
  Features,
  HowItWorks,
  Stats,
  LiveDemo,
  CTA,
  Footer,
} from "./components/sections";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <LiveDemo />
      <CTA />
      <Footer />
    </>
  );
}
