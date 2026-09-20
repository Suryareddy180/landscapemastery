import React, { useRef, useState } from "react";

// 3D tilt wrapper reacting to pointer position.
export default function TiltCard({ children, className = "", max = 10, ...props }) {
  const ref = useRef(null);
  const [t, setT] = useState({ rx: 0, ry: 0 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * max, ry: px * max });
  };
  const reset = () => setT({ rx: 0, ry: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{
        transform: `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
        transition: "transform 0.2s ease-out",
        transformStyle: "preserve-3d",
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
