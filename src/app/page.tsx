import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import DayJourney from "@/components/site/DayJourney";
import Footer from "@/components/site/Footer";
import {
  About,
  Contact,
  Questions,
  Services,
} from "@/components/site/Sections";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Services />
        <DayJourney />
        <About />
        <Questions />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
