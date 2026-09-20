import React from "react";
import { motion } from "framer-motion";

// Scroll-triggered reveal wrapper.
export default function Reveal({ children, delay = 0, y = 20, className = "", once = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fail-safe heading reveal component (avoids text clipping or blank animation gaps)
export function WordReveal({ text, className = "", delay = 0, immediate = false }) {
  const animProps = immediate
    ? { animate: { opacity: 1, y: 0 } }
    : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0 } };

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 14 }}
      {...animProps}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "inline-block" }}
    >
      {text}
    </motion.span>
  );
}
