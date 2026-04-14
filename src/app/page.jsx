"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Settings2, Globe } from "lucide-react";
import { useState } from "react";

// Symmetric face mesh — centered at AXIS_X=260, scaled to fit inside oval
const FACE_NODES = [
    { cx: 260, cy: 271 }, // 0: chin
    { cx: 235, cy: 259 }, // 1: lower jaw L
    { cx: 285, cy: 259 }, // 2: lower jaw R
    { cx: 215, cy: 238 }, // 3: jaw L
    { cx: 305, cy: 238 }, // 4: jaw R
    { cx: 260, cy: 241 }, // 5: lower lip
    { cx: 240, cy: 230 }, // 6: mouth corner L
    { cx: 281, cy: 230 }, // 7: mouth corner R
    { cx: 260, cy: 226 }, // 8: upper lip
    { cx: 207, cy: 210 }, // 9: cheek L
    { cx: 313, cy: 210 }, // 10: cheek R
    { cx: 250, cy: 214 }, // 11: nostril L
    { cx: 270, cy: 214 }, // 12: nostril R
    { cx: 260, cy: 208 }, // 13: nose tip
    { cx: 260, cy: 185 }, // 14: nose bridge
    { cx: 231, cy: 185 }, // 15: under-eye L
    { cx: 289, cy: 185 }, // 16: under-eye R
    { cx: 194, cy: 181 }, // 17: temple L
    { cx: 326, cy: 181 }, // 18: temple R
    { cx: 235, cy: 173 }, // 19: eye L
    { cx: 285, cy: 173 }, // 20: eye R
    { cx: 244, cy: 156 }, // 21: brow inner L
    { cx: 276, cy: 156 }, // 22: brow inner R
    { cx: 223, cy: 159 }, // 23: brow outer L
    { cx: 297, cy: 159 }, // 24: brow outer R
    { cx: 227, cy: 137 }, // 25: forehead L
    { cx: 293, cy: 137 }, // 26: forehead R
    { cx: 260, cy: 128 }, // 27: forehead center
];

// Symmetric mesh — every left connection has a right mirror
const FACE_LINES = [
    // Forehead triangulation
    [27, 25],
    [27, 26],
    [25, 26],
    [25, 23],
    [26, 24],
    // Brows
    [23, 21],
    [24, 22],
    [21, 22],
    [23, 25],
    [24, 26],
    [21, 14],
    [22, 14],
    // Brow to eye
    [21, 19],
    [22, 20],
    [23, 19],
    [24, 20],
    // Eye to temple
    [19, 17],
    [20, 18],
    [17, 25],
    [18, 26],
    // Eye to nose bridge
    [19, 14],
    [20, 14],
    // Eye to under-eye
    [19, 15],
    [20, 16],
    [15, 16],
    // Under-eye to nose
    [15, 14],
    [16, 14],
    [15, 13],
    [16, 13],
    // Nose
    [14, 13],
    [13, 11],
    [13, 12],
    [11, 12],
    // Nose to cheeks
    [11, 9],
    [12, 10],
    [13, 9],
    [13, 10],
    // Temple to cheek
    [17, 9],
    [18, 10],
    // Cheek to mouth
    [9, 6],
    [10, 7],
    [9, 11],
    [10, 12],
    // Nose to mouth
    [11, 6],
    [12, 7],
    [11, 8],
    [12, 8],
    // Mouth
    [6, 8],
    [7, 8],
    [6, 5],
    [7, 5],
    [8, 5],
    // Mouth to jaw
    [6, 3],
    [7, 4],
    [9, 3],
    [10, 4],
    // Jaw line
    [3, 1],
    [4, 2],
    [1, 2],
    // Jaw to chin
    [1, 0],
    [2, 0],
    [5, 0],
    [3, 1],
    [4, 2],
];

const languages = [
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
    { code: "fr", label: "FR" },
    { code: "de", label: "DE" },
    { code: "it", label: "IT" },
    { code: "tr", label: "TR" },
    { code: "pt", label: "PT" },
];

export default function LandingPage() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [langOpen, setLangOpen] = useState(false);

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
            {/* Dotted grid background — fades at edges, slow drift animation */}
            <div
                className="pointer-events-none absolute inset-0 animate-[dotDrift_60s_linear_infinite]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(120, 110, 140, 0.18) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    maskImage:
                        "radial-gradient(ellipse 70% 70% at center, black 30%, transparent 90%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 70% 70% at center, black 30%, transparent 90%)",
                }}
            />
            {/* Subtle pulse overlay for the grid — gentle breathing effect */}
            <motion.div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(232, 114, 138, 0.12) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    maskImage:
                        "radial-gradient(ellipse 50% 50% at center, black 0%, transparent 80%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 50% 50% at center, black 0%, transparent 80%)",
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Light navbar */}
            <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
                <Link href="/" className="flex items-center gap-2.5">
                    <Image
                        src="/logo-new.svg"
                        alt="Beauty & Glow AI"
                        width={28}
                        height={28}
                    />
                    <span
                        className="text-sm font-medium text-foreground/70"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                        Beauty &amp; Glow
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    <Link
                        href="/config"
                        className="flex items-center gap-1.5 rounded-full border border-secondary/40 px-4 py-1.5 text-xs text-foreground/70 transition-colors hover:border-secondary hover:text-foreground"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        {t("nav.config", "Config")}
                    </Link>

                    {/* Language toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setLangOpen(!langOpen)}
                            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                            aria-label="Change language"
                        >
                            <Globe className="h-3.5 w-3.5" />
                            {i18n.language?.toUpperCase().slice(0, 2)}
                        </button>
                        {langOpen && (
                            <div className="absolute right-0 mt-2 flex gap-1 rounded-lg border bg-background p-2 shadow-lg">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            i18n.changeLanguage(lang.code);
                                            setLangOpen(false);
                                        }}
                                        className={`rounded-md px-2 py-1 text-[10px] transition-colors ${
                                            i18n.language === lang.code
                                                ? "bg-secondary text-white"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero content — vertically centered on desktop */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8 sm:py-12">
                {/* Face illustration with metric pills */}
                <div className="relative mb-10 h-[380px] w-full max-w-[520px]">
                    {/* SVG Face */}
                    <svg
                        viewBox="0 0 520 380"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute inset-0 h-full w-full"
                    >
                        {/* Outer scanning arc — navy, thick stroke */}
                        <motion.circle
                            cx="260"
                            cy="200"
                            r="140"
                            stroke="#1A1A2E"
                            strokeWidth="12"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray="660 220"
                            initial={{ strokeDashoffset: 880, rotate: -225 }}
                            animate={{ strokeDashoffset: 0, rotate: -225 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            style={{ transformOrigin: "260px 200px" }}
                        />

                        {/* Face oval — filled blush */}
                        <motion.ellipse
                            cx="260"
                            cy="208"
                            rx="80"
                            ry="100"
                            fill="#F4A7B9"
                            stroke="none"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.3,
                                ease: "easeOut",
                            }}
                            style={{ transformOrigin: "260px 208px" }}
                        />

                        {/* Scan lines inside the face — navy, marching dashes */}
                        {FACE_LINES.map(([a, b], i) => (
                            <motion.line
                                key={`line-${i}`}
                                x1={FACE_NODES[a].cx}
                                y1={FACE_NODES[a].cy}
                                x2={FACE_NODES[b].cx}
                                y2={FACE_NODES[b].cy}
                                stroke="#1A1A2E"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                initial={{ strokeDashoffset: 0, opacity: 0 }}
                                animate={{
                                    strokeDashoffset: [0, -16],
                                    opacity: 0.45,
                                }}
                                transition={{
                                    strokeDashoffset: {
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                    },
                                    opacity: {
                                        delay: 0.8 + i * 0.1,
                                        duration: 0.6,
                                    },
                                }}
                            />
                        ))}

                        {/* Scan node dots inside the face — navy, pulsing */}
                        {FACE_NODES.map((dot, i) => (
                            <motion.circle
                                key={`dot-${i}`}
                                cx={dot.cx}
                                cy={dot.cy}
                                r="3"
                                fill="#1A1A2E"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: [0, 1, 0.35, 1],
                                    scale: [0, 1, 0.8, 1],
                                }}
                                transition={{
                                    opacity: {
                                        delay: 1 + i * 0.12,
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    },
                                    scale: {
                                        delay: 1 + i * 0.12,
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    },
                                }}
                                style={{
                                    transformOrigin: `${dot.cx}px ${dot.cy}px`,
                                }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Brand name */}
                <motion.h1
                    className="mb-3 text-center text-4xl sm:text-5xl tracking-wide text-foreground"
                    style={{
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 300,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    Beauty &amp; Glow <span className="text-[#E8728A]">AI</span>
                </motion.h1>

                {/* Tagline */}
                <motion.p
                    className="mb-10 text-center text-sm tracking-widest text-secondary sm:text-base"
                    style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 400,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    {t("landing.tagline", "Your skin. Analyzed. Understood.")}
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    <button
                        onClick={() => router.push("/scan")}
                        className="rounded-full border-2 border-[#E8728A] bg-transparent px-8 py-3 text-sm font-medium text-[#E8728A] transition-all duration-300 hover:bg-[#E8728A] hover:text-white hover:shadow-lg hover:shadow-[#E8728A]/20"
                        style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: 500,
                        }}
                    >
                        {t("landing.cta", "Scan My Skin")}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
