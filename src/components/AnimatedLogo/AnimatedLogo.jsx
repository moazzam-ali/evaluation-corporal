"use client";

/**
 * AnimatedLogo — renders the actual brand mark (`/logo.svg`) and animates it
 * with a continuous draw → hold → erase mask loop, a scan line that travels
 * with the mask edge, and a soft halo pulse behind the figure.
 *
 * The brand SVG is a raster-wrapped image, so there is no vector path to
 * stroke-dash. Instead we animate `clip-path: inset(...)` over the rendered
 * image which gives the same visual effect: the silhouette appears to draw
 * itself top-to-bottom, hold, then erase top-to-bottom — and the cycle loops.
 */
export default function AnimatedLogo({
  size = 240,
  showText = false,
  text = "",
  duration = 5.2,
}) {
  // The mark is portrait. We give it a portrait container ~3:7 wide:tall
  // so the figure fills the box without empty vertical bands.
  const w = size;
  const h = Math.round(size * 1.0);
  const LOGO = "/logo.svg";

  const cycle = `${duration}s cubic-bezier(0.65, 0, 0.35, 1) 0.4s infinite`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative"
        style={{
          width: w,
          height: h,
          // Halo glow lives outside the clipped layer so it keeps pulsing
          // even while the figure is erased.
        }}
      >
        {/* Soft halo glow — pulses behind the figure */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(199,169,119,0.40) 0%, rgba(199,169,119,0) 60%)",
            animation: `logoHalo ${duration * 0.9}s ease-in-out infinite`,
            transformOrigin: "50% 50%",
          }}
        />

        {/* Faint ghost copy — keeps a subtle outline visible during the
            hidden/erased frames so the figure never fully disappears */}
        <img
          src={LOGO}
          alt=""
          width={w}
          height={h}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: 0.08,
          }}
        />

        {/* Main figure — the drawing layer. clip-path is animated by CSS so
            it interpolates cleanly across browsers. */}
        <div
          className="absolute inset-0"
          style={{
            animation: `logoMask ${cycle}`,
            filter: "drop-shadow(0 0 10px rgba(199,169,119,0.45))",
          }}
        >
          <img
            src={LOGO}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Scan line — travels top-to-bottom in sync with the draw and erase
            passes, fades out briefly between them. */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: 2,
            top: 0,
            background:
              "linear-gradient(90deg, rgba(199,169,119,0), rgba(199,169,119,0.95), rgba(199,169,119,0))",
            boxShadow: "0 0 18px rgba(199,169,119,0.7)",
            animation: `logoScan ${cycle}`,
            willChange: "transform, opacity",
          }}
        />
      </div>

      {showText && text && (
        <p className="text-sm font-medium" style={{ color: "var(--muted-fg, #6B5B4B)" }}>
          {text}
        </p>
      )}
    </div>
  );
}
