import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

const CONFETTI_COLORS = [
  "#FF6B6B", "#4D96FF", "#6BCB77", "#FFD93D", "#FF923F", 
  "#E84545", "#903749", "#9B5DE5", "#F15BB5", "#00F5D4"
];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

interface ConfettiBurstProps {
  active: boolean;
  onComplete?: () => void;
  count?: number;
  origin?: { x: number; y: number }; // relative to container or viewport (%)
  mode?: "burst" | "rain";
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  active,
  onComplete,
  count = 45,
  origin = { x: 50, y: 50 },
  mode = "burst"
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.random() * 360 * Math.PI) / 180;
      const distance = Math.random() * 140 + 40; // explosion spread radius
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - (Math.random() * 60 + 20); // slightly upward bias (fountains up)

      return {
        id: i,
        x: mode === "burst" ? targetX : Math.random() * 500 - 250,
        y: mode === "burst" ? targetY : Math.random() * 300 + 400, // rain falls down
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 8 + 6,
        delay: Math.random() * 0.15,
        duration: Math.random() * 1.5 + 1.2,
        rotation: Math.random() * 360
      };
    });

    setParticles(newParticles);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [active, count, mode, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]" style={{ perspective: "1000px" }}>
      {particles.map((p) => {
        if (mode === "burst") {
          return (
            <motion.div
              key={p.id}
              initial={{ 
                x: `${origin.x}%`, 
                y: `${origin.y}%`, 
                scale: 0.2, 
                opacity: 1, 
                rotate: 0 
              }}
              animate={{
                x: `calc(${origin.x}% + ${p.x}px)`,
                y: `calc(${origin.y}% + ${p.y}px)`,
                scale: [0.2, 1.3, 0.8, 0],
                opacity: [1, 1, 0.8, 0],
                rotate: p.rotation + 360,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeOut",
              }}
              className="absolute rounded-xs shadow-xs"
              style={{
                backgroundColor: p.color,
                width: p.size,
                height: p.size * (Math.random() > 0.5 ? 1 : 1.6), // rectangle/square mix
                left: 0,
                top: 0,
                transform: "translate(-50%, -50%)"
              }}
            />
          );
        } else {
          // falling rain for checkout/global success
          return (
            <motion.div
              key={p.id}
              initial={{ 
                x: `${Math.random() * 100}%`,
                y: "-10%",
                scale: 0.5,
                opacity: 1,
                rotate: p.rotation
              }}
              animate={{
                y: "110%",
                x: `calc(${Math.random() * 10}% - 5% + inherit)`,
                rotate: p.rotation + 720,
                opacity: [1, 1, 0.5, 0]
              }}
              transition={{
                duration: p.duration + 2,
                delay: p.delay,
                ease: "easeOut",
              }}
              className="absolute rounded-xs"
              style={{
                backgroundColor: p.color,
                width: p.size,
                height: p.size * (Math.random() > 0.5 ? 1 : 1.5),
                left: 0,
                top: 0
              }}
            />
          );
        }
      })}
    </div>
  );
};
