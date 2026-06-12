"use client";

import { motion } from "framer-motion";

/**
 * AnimatedLogo — draws the actual brand silhouette as real SVG paths,
 * not a raster. The two paths below were traced from public/logo-mark.png
 * (cropped brand SVG) via potrace, so they match the exact logo shape and
 * can be stroke-dash-animated for a continuous, artistic draw loop.
 *
 * Animation is intentionally non-linear:
 *  - each segment has its own phase offset so the strokes don't move in
 *    lockstep, which makes the gesture read as a single moving hand
 *  - cubic easing (0.65, 0, 0.35, 1) for the draw, gentle ease for erase
 *  - a soft taupe halo trace is drawn underneath every visible stroke
 *  - a glowing trailing dot rides the end of the line as it draws
 *  - the whole figure sways ±1.5° on a slower cycle so it never feels static
 */

// Real traced paths from the brand mark (potrace output). Coordinates are
// in the source viewBox (115.35 × 339.42); we wrap them in a <g> with the
// same flip/scale transform potrace produced.
const PATHS = [
  // Outer contour — body silhouette
  "M572 3519 c-80 -15 -136 -62 -174 -144 -44 -97 -22 -320 39 -387 22 -25 83 -23 135 3 41 21 41 21 33 -36 -13 -106 -28 -136 -140 -275 -96 -119 -113 -185 -79 -314 19 -71 22 -213 6 -271 -12 -41 -35 -82 -132 -234 -48 -74 -54 -89 -56 -140 0 -32 -9 -79 -19 -104 -17 -46 -17 -71 1 -152 7 -29 7 -29 -17 -14 -13 9 -32 31 -42 50 -34 64 -21 127 85 414 123 332 126 344 136 566 11 233 20 252 127 310 38 21 71 42 73 48 7 21 -22 22 -71 1 -142 -60 -163 -105 -176 -370 -12 -224 -8 -209 -137 -559 -52 -141 -98 -275 -101 -298 -8 -61 14 -129 57 -174 77 -81 132 -34 99 85 -9 32 -7 46 10 86 12 29 21 70 21 101 0 45 7 63 46 126 25 41 47 73 49 71 1 -2 -4 -43 -12 -93 -20 -124 -12 -413 15 -546 30 -144 93 -350 109 -356 30 -12 32 14 7 92 -118 380 -132 632 -53 970 40 172 47 270 24 369 -35 159 -23 207 83 334 100 119 132 192 132 299 0 50 4 59 50 116 77 95 90 167 35 203 -53 35 -108 -42 -121 -169 -7 -68 -7 -68 -55 -93 -71 -36 -86 -32 -111 23 -25 57 -36 207 -19 269 48 179 283 212 367 52 26 -50 18 -139 -21 -232 -19 -47 -35 -98 -35 -115 0 -82 60 -148 169 -187 150 -54 157 -64 218 -372 52 -264 55 -398 13 -582 -12 -52 -25 -151 -29 -221 -9 -151 -28 -195 -106 -247 -56 -38 -64 -49 -40 -58 19 -8 66 16 108 55 53 49 69 95 78 226 4 66 20 179 35 250 43 205 39 331 -19 607 -63 300 -75 319 -232 379 -151 58 -178 119 -112 262 66 148 36 285 -78 347 -58 32 -112 41 -173 29z m148 -291 c0 -20 -12 -50 -31 -78 -31 -45 -31 -45 -24 10 10 84 55 139 55 68z",
  // Inner detail — head loop + body curves that cross
  "M774 2681 c-103 -63 -140 -268 -81 -443 26 -76 26 -76 -28 -180 -177 -341 -198 -647 -79 -1167 26 -112 26 -117 13 -239 -22 -211 16 -441 83 -497 16 -14 33 -25 37 -25 89 0 199 480 152 660 -20 75 -62 170 -77 170 -24 0 -25 -19 0 -77 67 -161 58 -348 -30 -615 -28 -85 -38 -98 -61 -75 -33 32 -55 146 -59 302 -2 107 -1 140 6 115 15 -55 40 -211 40 -251 0 -44 21 -67 40 -44 18 22 -1 164 -49 366 -21 85 -21 85 8 205 23 93 131 437 212 679 6 17 13 75 16 130 7 128 -8 187 -86 344 l-60 120 63 110 c35 60 69 131 76 156 20 70 26 64 65 -56 35 -110 36 -116 41 -313 9 -306 10 -291 -31 -369 -43 -81 -55 -188 -24 -195 14 -2 18 8 24 50 4 29 25 93 47 142 41 89 41 89 32 205 -5 64 -8 171 -6 238 3 122 3 122 -43 260 -92 275 -152 349 -241 294z m77 -41 c54 -29 57 -97 10 -220 -23 -61 -101 -200 -112 -200 -17 0 -42 153 -36 224 12 152 69 233 138 196z m21 -829 c18 -104 -2 -199 -107 -525 -52 -160 -103 -320 -113 -356 -18 -64 -18 -64 -45 75 -86 438 -65 691 80 995 l55 115 59 -120 c38 -77 63 -143 71 -184z",
];

// Phase offsets — each path starts drawing on its own beat so the two
// strokes never animate in unison. Smaller numbers = earlier start.
const PHASE = [0, 0.16];

export default function AnimatedLogo({
  size = 240,
  showText = false,
  text = "",
  color = "#C7A977",     // warm gold ink
  haloColor = "#9B8573", // taupe halo trace
  duration = 5.4,
}) {
  // Use framer-motion's normalized pathLength so we don't have to measure
  // each path. Setting strokeDasharray={1} + animating strokeDashoffset
  // between 1 → 0 → -1 yields draw → hold → erase on every path uniformly.
  const DASH = 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 115.346064 339.415154"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: [-1.5, 1.5, -1.5] }}
        transition={{
          duration: duration * 1.6,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{ transformOrigin: "50% 50%", overflow: "visible" }}
      >
        {/* potrace flips Y and scales 0.1× — match that here */}
        <g transform="translate(-6.143342,352.415154) scale(0.1,-0.1)">
          {/* Halo trace — thicker, lower opacity, slightly delayed */}
          {PATHS.map((d, i) => (
            <motion.path
              key={`halo-${i}`}
              d={d}
              stroke={haloColor}
              strokeWidth={55}
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
                repeatDelay: 0.3,
                delay: PHASE[i] + 0.12,
              }}
            />
          ))}

          {/* Main visible ink strokes — phase-staggered draw → hold → erase */}
          {PATHS.map((d, i) => (
            <motion.path
              key={`line-${i}`}
              d={d}
              stroke={color}
              strokeWidth={26}
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
                ease: [0.65, 0, 0.35, 1],
                repeat: Infinity,
                repeatDelay: 0.3,
                delay: PHASE[i],
              }}
            />
          ))}
        </g>

        {/* Trailing glow dot — rides loosely with the draw to suggest a
            single moving hand. Positioned in the outer SVG coord space
            (115 × 339) so it sits in front of the transformed group. */}
        <motion.circle
          r={3.6}
          fill={color}
          animate={{
            opacity: [0, 0.95, 0.95, 0],
            cx: [60, 64, 56, 60],
            cy: [40, 180, 300, 40],
          }}
          transition={{
            duration,
            times: [0, 0.35, 0.7, 1],
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.3,
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
