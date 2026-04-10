"use client";

import { motion } from "framer-motion";

const particles = Array.from({ length: 14 }).map((_, index) => ({
  id: index,
  size: (index % 4) + 4,
  left: `${(index * 7) % 100}%`,
  delay: index * 0.2,
  duration: 6 + (index % 5),
}));

export function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-cyan-300/40 blur-[1px]"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: particle.left,
            bottom: "-20px",
          }}
          animate={{
            y: [-10, -220, -400],
            x: [0, particle.id % 2 === 0 ? 20 : -20, 0],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.1, 0.9],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
