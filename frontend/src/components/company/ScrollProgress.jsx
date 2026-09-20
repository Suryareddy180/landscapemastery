import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-[1100] h-[3px] origin-left"
    >
      <div className="h-full w-full bg-gradient-to-r from-accent via-[var(--accent2)] to-accent" />
    </motion.div>
  );
}
