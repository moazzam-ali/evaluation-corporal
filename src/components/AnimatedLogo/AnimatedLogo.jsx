"use client";

import { motion } from "framer-motion";

const NAVY_ARC = "#0B1B33";
const BLUSH_FACE = "#6FA0FF";
const ROSE_DOT = "#2C5BFF";

export default function AnimatedLogo({ size = 120, showText = false, text = "" }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Face oval dimensions (proportional to the logo)
  const faceRx = s * 0.28;
  const faceRy = s * 0.33;
  const faceCy = cy + s * 0.03;

  // Arc radius and stroke
  const arcRadius = s * 0.38;
  const arcStroke = s * 0.045;
  const arcCircumference = 2 * Math.PI * arcRadius;
  // Arc covers ~270 degrees (open at bottom)
  const arcVisible = arcCircumference * 0.75;
  const arcGap = arcCircumference - arcVisible;

  // Pink dot position (lower-left area of face)
  const dotCx = cx - faceRx * 0.3;
  const dotCy = faceCy + faceRy * 0.25;
  const dotR = s * 0.035;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pink arc — draws in from the top, rotating appearance */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={arcRadius}
          stroke={NAVY_ARC}
          strokeWidth={arcStroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${arcVisible} ${arcGap}`}
          strokeDashoffset={arcCircumference}
          initial={{ strokeDashoffset: arcCircumference, rotate: -225 }}
          animate={{
            strokeDashoffset: [arcCircumference, 0, 0, arcCircumference],
            rotate: [-225, -225, -225, -225],
          }}
          transition={{
            strokeDashoffset: {
              duration: 3.2,
              times: [0, 0.35, 0.75, 1],
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.6,
            },
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Navy face oval — scales in with spring */}
        <motion.ellipse
          cx={cx}
          cy={faceCy}
          rx={faceRx}
          ry={faceRy}
          fill={BLUSH_FACE}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{
            duration: 3.2,
            times: [0, 0.25, 0.6, 0.8, 1],
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.6,
          }}
          style={{ transformOrigin: `${cx}px ${faceCy}px` }}
        />

        {/* Pink dot — pops in after face, pulses, then fades */}
        <motion.circle
          cx={dotCx}
          cy={dotCy}
          r={dotR}
          fill={ROSE_DOT}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 0, 1.3, 1, 1.15, 1, 0],
            opacity: [0, 0, 1, 1, 1, 1, 0],
          }}
          transition={{
            duration: 3.2,
            times: [0, 0.35, 0.45, 0.5, 0.55, 0.75, 0.85],
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 0.6,
          }}
          style={{ transformOrigin: `${dotCx}px ${dotCy}px` }}
        />
      </svg>

      {showText && text && (
        <motion.p
          className="text-sm font-medium text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
