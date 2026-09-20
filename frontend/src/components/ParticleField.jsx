import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

// Canvas particle network with subtle mouse interaction. Lightweight + reduced-motion aware.
export default function ParticleField({ density = 50, className = "" }) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let points = [];

    const greenRGB = theme === "dark" ? "17,168,49" : "17,168,49";
    const blueRGB = theme === "dark" ? "43,115,255" : "5,73,177";
    const UNIFORM_SPEED = 0.28;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(density, Math.floor((w * h) / 18000));
      points = Array.from({ length: count }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * UNIFORM_SPEED,
          vy: Math.sin(angle) * UNIFORM_SPEED,
          color: i % 2 === 0 ? greenRGB : blueRGB,
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;

        // Clean wall bounce maintaining uniform velocity magnitude
        if (p.x <= 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x >= w) { p.x = w; p.vx = -Math.abs(p.vx); }
        if (p.y <= 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        if (p.y >= h) { p.y = h; p.vy = -Math.abs(p.vy); }

        // Mouse deflection with strictly preserved uniform speed
        const dxm = p.x - mouse.x;
        const dym = p.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm > 0 && dm < 100) {
          const pushAngle = Math.atan2(dym, dxm);
          p.vx = Math.cos(pushAngle) * UNIFORM_SPEED;
          p.vy = Math.sin(pushAngle) * UNIFORM_SPEED;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},0.55)`;
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 85) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${p.color},${0.09 * (1 - d / 85)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [theme, density]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
