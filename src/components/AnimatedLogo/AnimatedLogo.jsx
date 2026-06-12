"use client";

import { motion } from "framer-motion";

/**
 * AnimatedLogo — continuous-line body silhouette that draws and un-draws
 * itself in a soft, non-linear loop. Used on the analyzing screen and as a
 * standalone brand mark.
 *
 * The silhouette is built from three layered paths that share the same
 * dash cycle but offset in phase, so the line reads as one continuous
 * artistic gesture rather than a rigid linear sweep.
 */

// Three flowing path segments tracing the body silhouette in our brand
// viewBox of 0 0 240 600. Coordinates were tuned by eye to approximate the
// continuous-line mark; precise vectorisation is not the goal — what matters
// is the soft, organic feel as the strokes draw in.
const SILHOUETTE_PATHS = [
  // 1. Head loop + neck + right shoulder + right arm down
  "M 120 70 C 100 68 88 82 88 102 C 88 118 96 128 110 134 C 122 132 130 124 130 110 C 130 96 122 90 116 96 C 112 100 116 108 122 108 M 116 134 C 108 144 104 158 108 174 C 122 182 138 196 148 220 C 158 248 162 282 158 318 C 154 348 144 376 134 402",
  // 2. Right leg flowing down to foot, crossing back up left leg, up the
  // inside of the torso and out to the left shoulder
  "M 134 402 C 136 432 142 462 148 492 C 152 514 150 532 142 546 C 132 540 122 522 116 498 C 108 466 104 432 106 400 C 108 372 116 346 122 322 C 114 304 108 282 104 260 C 100 232 100 204 108 178 C 96 192 86 214 82 240 C 78 272 80 304 84 336 C 88 366 92 396 92 424 C 92 456 96 486 104 512",
  // 3. Left leg cross + foot + closing loop back across torso
  "M 104 512 C 108 530 116 542 128 544 C 138 542 144 528 142 510 C 138 488 130 466 124 444 C 126 416 130 388 132 360 C 138 332 148 308 158 286 C 168 266 174 244 170 220 C 164 196 152 178 138 168",
];

export default function AnimatedLogo({
  size = 240,
  showText = false,
  text = "",
  color = "#C7A977",       // warm gold by default, reads on dark backgrounds
  haloColor = "#9B8573",   // taupe halo / second pass
  duration = 5.4,          // one full draw+erase loop
}) {
  // SVG length used to normalise stroke-dashing — large enough to cover any
  // path; framer-motion handles the actual path-length math for us when we
  // animate `pathLength` on the dash itself.
  const DASH = 1;

  // Per-path phase offsets so the strokes don't move in lock-step — this is
  // what makes the loop feel like a continuous, hand-drawn gesture instead of
  // a single linear sweep.
  const PHASE = [0, 0.18, 0.34];

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 240 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        // Subtle organic sway on the whole figure
        animate={{ rotate: [-1.5, 1.5, -1.5] }}
        transition={{
          duration: duration * 1.6,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{ transformOrigin: "50% 50%", overflow: "visible" }}
      >
        {/* Soft halo strokes drawn first, slightly thicker + lower opacity */}
        {SILHOUETTE_PATHS.map((d, i) => (
          <motion.path
            key={`halo-${i}`}
            d={d}
            stroke={haloColor}
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.22}
            pathLength={DASH}
            strokeDasharray={DASH}
            initial={{ strokeDashoffset: DASH }}
            animate={{
              strokeDashoffset: [DASH, 0, 0, -DASH],
              opacity: [0, 0.22, 0.22, 0],
            }}
            transition={{
              duration,
              times: [0, 0.42, 0.58, 1],
              ease: [0.65, 0, 0.35, 1],
              repeat: Infinity,
              repeatDelay: 0.25,
              delay: PHASE[i] + 0.12,
            }}
          />
        ))}

        {/* Main strokes — the visible line. Each segment draws then erases
            on a staggered phase so the gesture feels like one moving hand. */}
        {SILHOUETTE_PATHS.map((d, i) => (
          <motion.path
            key={`line-${i}`}
            d={d}
            stroke={color}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            pathLength={DASH}
            strokeDasharray={DASH}
            initial={{ strokeDashoffset: DASH }}
            animate={{
              strokeDashoffset: [DASH, 0, 0, -DASH],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration,
              times: [0, 0.42, 0.58, 1],
              // Soft ease-in-out for the draw, gentler ease-out for the erase
              ease: [0.65, 0, 0.35, 1],
              repeat: Infinity,
              repeatDelay: 0.25,
              delay: PHASE[i],
            }}
          />
        ))}

        {/* Trailing glow dot — rides the end of the stroke for a writing feel */}
        <motion.circle
          r={3.2}
          fill={color}
          animate={{
            opacity: [0, 0.9, 0.9, 0],
            cx: [120, 132, 116, 132],
            cy: [70, 320, 470, 70],
          }}
          transition={{
            duration,
            times: [0, 0.35, 0.7, 1],
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.25,
          }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </motion.svg>

      {showText && text && (
        <motion.p
          className="text-sm font-medium"
          style={{ color: "var(--muted-fg, #6B5B4B)" }}
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
