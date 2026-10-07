import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ScrollProgress from "../components/ScrollProgress";
import CompanyFooter from "../components/CompanyFooter";
import Hero from "../sections/Hero";
import About from "../sections/About";
import Services from "../sections/Services";
import Industries from "../sections/Industries";
import DevelopmentProcess from "../sections/DevelopmentProcess";
import TechOrbit from "../sections/TechOrbit";
import Products from "../sections/Products";
import WhyChooseUs from "../sections/WhyChooseUs";
import Testimonials from "../sections/Testimonials";
import Contact from "../sections/Contact";

export default function CompanyHome() {
  const location = useLocation();

  useEffect(() => {
    document.title = "3CAPSTECH | We Design Future Technology";
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.hash, location.pathname]);

  return (
    <div className="bg-[var(--bg)] text-slate-100 min-h-screen font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Industries />
        <DevelopmentProcess />
        <TechOrbit />
        <Products />
        <WhyChooseUs />
        <Testimonials />
        <Contact />
      </main>
      <CompanyFooter />
    </div>
  );
}
