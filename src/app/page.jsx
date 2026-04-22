"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Globe, Settings2, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect, Suspense } from "react";
import products from "@/data/products.json";
import { LANGUAGES } from "@/lib/languages";

/* ── tiny helpers ──────────────────────────────────────────────── */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const languages = LANGUAGES;

const METRICS = [
  { name: "Hydration",       desc: "Stratum-corneum moisture cues across forehead, cheek, chin.",   tier: "good",  fill: 82 },
  { name: "Barrier",         desc: "Ceramide-lipid integrity inferred from tonal recovery.",        tier: "mid",   fill: 64 },
  { name: "Pore visibility", desc: "Size and shadow depth across T-zone and mid-cheek.",            tier: "mid",   fill: 58 },
  { name: "Even tone",       desc: "Variance of L*a*b* values vs. baseline patch.",                 tier: "good",  fill: 78 },
  { name: "Redness",         desc: "Erythema index derived from red-channel isolation.",            tier: "alert", fill: 41 },
  { name: "Fine lines",      desc: "Micro-creasing at forehead, under-eye, peri-oral zones.",       tier: "mid",   fill: 58 },
  { name: "Sebum",           desc: "Shine mapping across T-zone with specular separation.",         tier: "good",  fill: 72 },
  { name: "Texture",         desc: "High-frequency surface detail — congestion, flakiness.",        tier: "good",  fill: 76 },
  { name: "Dark circles",    desc: "Periorbital shadow + discoloration, corrected for lighting.",   tier: "mid",   fill: 62 },
  { name: "Pigmentation",    desc: "Discrete hyperpigmented spots scored by area + contrast.",      tier: "good",  fill: 74 },
  { name: "Elasticity",      desc: "Inferred recoil from micro-expression frame differences.",      tier: "good",  fill: 80 },
  { name: "Glow",            desc: "Composite: hydration × even tone × low redness.",               tier: "good",  fill: 84 },
];

const MARQUEE_ITEMS = [
  "12 AI-Powered Metrics",
  "Personalized Routines",
  "HL/Skin Product Range",
  "Ingredient Science",
  "Multi-Language Support",
  "Instant Analysis",
  "Dermatologist-Grade Insights",
  "Morning & Evening Routines",
  "Powered by GPT-4o Vision",
  "8 Languages Supported",
];

const tierColor = (t) =>
  t === "good" ? "#5B9A8B" : t === "mid" ? "#D4A053" : "#E8728A";
const tierLabel = (t) =>
  t === "good" ? "Optimal" : t === "mid" ? "Watch" : "Flag";

/* ── Metric icons (inline SVGs, simplified) ────────────────────── */
function MetricIcon({ index }) {
  const icons = [
    /* Hydration   */ <svg key="0" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3c-3 4-6 8-6 12a6 6 0 0012 0c0-4-3-8-6-12z" stroke="#1A1A2E" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 14a3 3 0 003 3" stroke="#5B9A8B" strokeWidth="1.6" strokeLinecap="round"/></svg>,
    /* Barrier     */ <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="#1A1A2E" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="#D4A053" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    /* Pore vis    */ <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="8" r="1.4" fill="#1A1A2E"/><circle cx="13" cy="6" r="1.4" fill="#1A1A2E"/><circle cx="17" cy="10" r="1.4" fill="#D4A053"/><circle cx="9" cy="13" r="1.4" fill="#1A1A2E"/><circle cx="15" cy="15" r="1.4" fill="#1A1A2E"/><circle cx="6" cy="17" r="1.4" fill="#D4A053"/><circle cx="12" cy="18" r="1.4" fill="#1A1A2E"/></svg>,
    /* Even tone   */ <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 100 18c1 0 1-1 0-1.5S11 18 12 17s5-.5 5-4A9 9 0 0012 3z" stroke="#1A1A2E" strokeWidth="1.6"/><circle cx="8" cy="10" r="1.2" fill="#F4A7B9"/><circle cx="12" cy="7" r="1.2" fill="#E8728A"/><circle cx="15" cy="10" r="1.2" fill="#D4A053"/></svg>,
    /* Redness     */ <svg key="4" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3c1 3 4 4 4 8a4 4 0 01-8 0c0-2 1-2 2-4-1 3 1 4 2 3-2-2 0-5 0-7z" stroke="#E8728A" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
    /* Fine lines  */ <svg key="5" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="#D4A053" strokeWidth="1.6" strokeLinecap="round"/><path d="M3 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="#1A1A2E" strokeWidth="1.6" strokeLinecap="round" opacity="0.4"/></svg>,
    /* Sebum       */ <svg key="6" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="#1A1A2E" strokeWidth="1.6"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" stroke="#D4A053" strokeWidth="1.6" strokeLinecap="round"/></svg>,
    /* Texture     */ <svg key="7" width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#1A1A2E" strokeWidth="1.6"/><path d="M4 10h16M4 16h16M10 4v16M16 4v16" stroke="#5B9A8B" strokeWidth="1.2"/></svg>,
    /* Dark circles*/ <svg key="8" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16 3a9 9 0 10-1 18 7 7 0 011-18z" stroke="#1A1A2E" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
    /* Pigmentation*/ <svg key="9" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="1.6" fill="#E8728A"/><circle cx="15" cy="7" r="1" fill="#D45571"/><circle cx="17" cy="13" r="1.4" fill="#E8728A"/><circle cx="10" cy="14" r="1" fill="#D45571"/><circle cx="13" cy="17" r="1.3" fill="#E8728A"/><circle cx="7" cy="17" r="0.8" fill="#D45571"/></svg>,
    /* Elasticity  */ <svg key="10" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 5c3 2 3 4 0 6s-3 4 0 6 3 4 0 6" stroke="#5B9A8B" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 5c3 2 3 4 0 6s-3 4 0 6 3 4 0 6" stroke="#1A1A2E" strokeWidth="1.6" strokeLinecap="round" opacity="0.35"/></svg>,
    /* Glow        */ <svg key="11" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" fill="#E8728A"/><circle cx="19" cy="5" r="1" fill="#D4A053"/><circle cx="5" cy="17" r="1" fill="#5B9A8B"/></svg>,
  ];
  return icons[index] || null;
}

/* ══════════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageInner />
    </Suspense>
  );
}

function LandingPageInner() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Forward any URL params (n, b, a, c, l) to /scan links
  const paramString = searchParams.toString();
  const scanHref = paramString ? `/scan?${paramString}` : "/scan";
  const configHref = paramString ? `/config?${paramString}` : "/config";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden" style={{ background: "#FAFAFB" }}>

      {/* ─── STICKY NAV ──────────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-[rgba(26,26,46,0.08)] bg-[rgba(250,250,251,0.92)]"
            : "bg-[rgba(250,250,251,0.82)]"
        }`}
        style={{ backdropFilter: "saturate(180%) blur(18px)", WebkitBackdropFilter: "saturate(180%) blur(18px)" }}
      >
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
            <Image src="/logo-new.svg" alt="" width={32} height={32} />
            <span className="flex items-center whitespace-nowrap text-xl text-[#1A1A2E]">
              Beauty <span className="px-[0.12em] italic text-[#E8728A]" style={{ fontWeight: 400 }}>&amp;</span> Glow
              <span className="mx-2 inline-block h-[0.7em] w-px bg-current opacity-35" />
              <span className="text-[0.38em] tracking-[0.14em] text-[#E8728A]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500, transform: "translateY(-0.4em)" }}>AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-7 lg:flex" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500 }}>
            <a href="#how" className="text-[hsl(240,10%,46%)] transition-colors hover:text-[#1A1A2E]">{t("landing.nav_how", "How it works")}</a>
            <a href="#metrics" className="text-[hsl(240,10%,46%)] transition-colors hover:text-[#1A1A2E]">{t("landing.nav_metrics", "Metrics")}</a>
            <a href="#demo" className="text-[hsl(240,10%,46%)] transition-colors hover:text-[#1A1A2E]">{t("landing.nav_demo", "Live demo")}</a>
            <a href="#products" className="text-[hsl(240,10%,46%)] transition-colors hover:text-[#1A1A2E]">{t("landing.nav_products", "Products")}</a>
            <a href="#pricing" className="text-[hsl(240,10%,46%)] transition-colors hover:text-[#1A1A2E]">{t("landing.nav_pricing", "Pricing")}</a>
          </div>

          {/* Right side CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href={configHref}
              className="hidden items-center gap-1.5 rounded-full border border-[rgba(26,26,46,0.14)] bg-transparent px-4 py-2 text-xs text-[hsl(240,10%,46%)] transition-colors hover:border-[#1A1A2E] hover:text-[#1A1A2E] sm:inline-flex"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {t("landing.nav_config", "Config")}
            </Link>
            <Link
              href={scanHref}
              className="inline-flex items-center gap-2 rounded-full bg-[#E8728A] px-4 py-2 text-xs text-white transition-all hover:-translate-y-px hover:bg-[#D45571] hover:shadow-[0_10px_28px_rgba(232,114,138,0.28)]"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13 }}
            >
              {t("landing.cta", "Scan My Skin")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 rounded-full border border-[hsl(340,15%,90%)] px-3 py-2 text-xs text-[hsl(240,10%,46%)] transition-colors hover:border-[#1A1A2E]/30 hover:text-[#1A1A2E]"
                aria-label="Change language"
              >
                <Globe className="h-3.5 w-3.5" />
                {i18n.language?.toUpperCase().slice(0, 2)}
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 flex gap-1 rounded-lg border bg-white p-2 shadow-lg">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                      className={`rounded-md px-2 py-1 text-[10px] transition-colors ${
                        i18n.language === lang.code ? "bg-[#E8728A] text-white" : "text-[hsl(240,10%,46%)] hover:text-[#1A1A2E]"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─ Variant B : Clinical Centered ──────────────────── */}
      <section className="relative overflow-hidden bg-white pb-24 pt-16 sm:pb-32" id="hero">
        {/* Floating blobs */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-[340px] w-[340px] rounded-full opacity-50 blur-[60px]" style={{ background: "#FDEEF1" }} />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-[260px] w-[260px] rounded-full opacity-50 blur-[60px]" style={{ background: "#E6F1ED" }} />

        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          {/* Centered text */}
          <div className="relative text-center" style={{ paddingTop: 64 }}>
            <Reveal className="flex justify-center">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-[rgba(26,26,46,0.08)] bg-white px-3.5 py-1.5 text-xs" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}>
                <span className="rounded-full bg-[#FDEEF1] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#D45571]">LIVE</span>
                {t("landing.hero_badge", "12 metrics \u00b7 dermatologist-trained")}
              </span>
            </Reveal>

            <Reveal delay={0.08}>
              <h1
                className="mx-auto mb-6 mt-6 max-w-[14ch] text-[clamp(60px,8vw,120px)] leading-[1.02] tracking-[-0.01em] text-[#1A1A2E]"
                style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}
              >
                {t("landing.hero_title_1", "Skin analysis,")}<br /><em className="not-italic text-[#E8728A]" style={{ fontWeight: 400 }}>{t("landing.hero_title_2", "no appointment")}</em> {t("landing.hero_title_3", "needed.")}
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mx-auto mb-8 max-w-[54ch] text-[19px] leading-relaxed text-[hsl(240,10%,46%)]">
                {t("landing.hero_subtitle", "One camera. Twelve clinical metrics. A plan your skin actually asked for.")}
              </p>
            </Reveal>

            <Reveal delay={0.24} className="flex flex-wrap justify-center gap-3">
              <Link
                href={scanHref}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#E8728A] px-5 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-[#D45571] hover:shadow-[0_10px_28px_rgba(232,114,138,0.28)]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {t("landing.hero_cta", "Scan My Skin — Free")}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[rgba(26,26,46,0.14)] bg-transparent px-5 py-3.5 text-sm text-[#1A1A2E] transition-colors hover:border-[#1A1A2E]"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
              >
                {t("landing.hero_demo_cta", "Watch the demo")}
              </a>
            </Reveal>

            {/* Canvas with face + rings + metric bubbles */}
            <Reveal delay={0.32}>
              <div className="pointer-events-none relative mx-auto mt-14" style={{ maxWidth: 880, aspectRatio: "16/9" }}>
                {/* Concentric dashed rings */}
                <div className="absolute inset-0">
                  {[780, 600, 420].map((size, i) => (
                    <div
                      key={size}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
                      style={{
                        width: size,
                        height: size,
                        borderColor: i === 0 ? "rgba(26,26,46,0.05)" : i === 1 ? "rgba(26,26,46,0.08)" : "rgba(26,26,46,0.14)",
                        opacity: i === 0 ? 0.6 : 1,
                      }}
                    />
                  ))}
                </div>

                {/* Center face oval */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden shadow-[0_30px_60px_-20px_rgba(26,26,46,0.18)]"
                  style={{
                    width: 280,
                    aspectRatio: "1/1.2",
                    borderRadius: "50% / 45%",
                    background: "linear-gradient(160deg, #FAF4EE 0%, #F9D1D9 55%, #F4A7B9 100%)",
                  }}
                >
                  <svg viewBox="0 0 300 360" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
                    <ellipse cx="150" cy="180" rx="90" ry="120" fill="#E89BAB" opacity="0.75" />
                    <ellipse cx="128" cy="170" rx="5" ry="3" fill="#1A1A2E" opacity="0.7" />
                    <ellipse cx="172" cy="170" rx="5" ry="3" fill="#1A1A2E" opacity="0.7" />
                    <path d="M132 230 Q150 240 168 230 Q150 235 132 230" fill="#D45571" opacity="0.75" />
                  </svg>
                </div>

                {/* Floating metric bubbles */}
                {[
                  { label: "Hydration", value: 82, status: "Optimal", tier: "good", pos: { top: "8%", left: "6%" }, anim: "floatA 6s ease-in-out infinite" },
                  { label: "Barrier", value: 64, status: "Watch", tier: "mid", pos: { top: "14%", right: "4%" }, anim: "floatB 7s ease-in-out infinite" },
                  { label: "Redness", value: 41, status: "Flag", tier: "alert", pos: { bottom: "12%", left: "10%" }, anim: "floatB 6.5s ease-in-out infinite 0.5s" },
                  { label: "Even tone", value: 78, status: "Good", tier: "good", pos: { bottom: "8%", right: "6%" }, anim: "floatA 5.5s ease-in-out infinite 0.3s" },
                ].map((bubble) => (
                  <div
                    key={bubble.label}
                    className="absolute rounded-2xl border border-[rgba(26,26,46,0.08)] bg-white p-3 px-4 text-left shadow-[0_12px_28px_rgba(26,26,46,0.08)]"
                    style={{ ...bubble.pos, minWidth: 150, fontFamily: "var(--font-dm-sans)", animation: bubble.anim }}
                  >
                    <div className="text-[10px] uppercase tracking-[0.14em] text-[hsl(240,10%,46%)]">{bubble.label}</div>
                    <div className="mt-1 flex items-baseline gap-1.5 text-[28px] leading-none text-[#1A1A2E]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}>
                      {bubble.value}
                      <span className="text-[10px] tracking-wider text-[hsl(240,10%,46%)]" style={{ fontFamily: "var(--font-dm-sans)" }}>/100</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: tierColor(bubble.tier) }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tierColor(bubble.tier) }} />
                      {bubble.status}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ──────────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-[rgba(26,26,46,0.08)] bg-white py-7">
        <div className="flex w-max animate-[marqueeSlide_40s_linear_infinite] items-center gap-16">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-16">
              <span className="whitespace-nowrap text-[22px] tracking-wide text-[#1A1A2E] opacity-55" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                {item}
              </span>
              <span className="text-[hsl(240,10%,46%)] opacity-60">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-28 sm:py-36" id="how" style={{ background: "#FAFAFB" }}>
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mb-20 grid items-end gap-12 lg:grid-cols-2">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(240,10%,46%)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  <span className="h-px w-6 bg-[#E8728A]" />{t("landing.how_label", "Process")}
                </span>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="mt-4 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.01em] text-[#1A1A2E]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, textWrap: "balance" }}>
                  {t("landing.how_title_1", "From selfie to")}<br /><em className="not-italic text-[#E8728A]" style={{ fontWeight: 400 }}>{t("landing.how_title_2", "skincare plan")}</em> {t("landing.how_title_3", "in four beats.")}
                </h2>
              </Reveal>
            </div>
            <Reveal delay={0.16}>
              <p className="max-w-[58ch] text-[17px] leading-relaxed text-[hsl(240,10%,46%)]" style={{ textWrap: "pretty" }}>
                {t("landing.how_subtitle", "No questionnaires, no skin-type quizzes. The camera does the reading \u2014 your routine updates every time you scan.")}
              </p>
            </Reveal>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { num: "01", title: t("landing.how_step1_title", "Frame your face"), text: t("landing.how_step1_text", "Natural light, no makeup. Hold steady for three seconds \u2014 we auto-capture five frames, pick the sharpest."), time: t("landing.how_step1_time", "~8 seconds"), icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect x="4" y="9" width="24" height="18" rx="4" stroke="#E8728A" strokeWidth="1.5"/><circle cx="16" cy="18" r="5" stroke="#E8728A" strokeWidth="1.5"/><circle cx="16" cy="18" r="2" fill="#E8728A"/><path d="M11 9l2-3h6l2 3" stroke="#E8728A" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              { num: "02", title: t("landing.how_step2_title", "AI reads 12 metrics"), text: t("landing.how_step2_text", "Hydration, barrier, pore visibility, tone evenness, redness, fine lines, sebum, texture and four more \u2014 all mapped to skin zones."), time: t("landing.how_step2_time", "~3 seconds"), icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" stroke="#E8728A" strokeWidth="1.5"/><circle cx="16" cy="16" r="6" stroke="#E8728A" strokeWidth="1.5" strokeDasharray="2 2"/><circle cx="16" cy="16" r="2" fill="#E8728A"/><path d="M16 2v4M16 26v4M2 16h4M26 16h4" stroke="#E8728A" strokeWidth="1.5" strokeLinecap="round"/></svg> },
              { num: "03", title: t("landing.how_step3_title", "Get your report"), text: t("landing.how_step3_text", "A plain-English readout \u2014 what\u2019s strong, what\u2019s stressed, what\u2019s changed since last time. Zones highlighted, trends tracked."), time: t("landing.how_step3_time", "Instant"), icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect x="6" y="4" width="20" height="24" rx="3" stroke="#E8728A" strokeWidth="1.5"/><path d="M11 11h10M11 16h10M11 21h6" stroke="#E8728A" strokeWidth="1.5" strokeLinecap="round"/></svg> },
              { num: "04", title: t("landing.how_step4_title", "Routine, curated"), text: t("landing.how_step4_text", "Products matched to your exact metrics. We tell you which ingredient does which job \u2014 and when to use them."), time: t("landing.how_step4_time", "Personalized"), icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M12 4c-3 3-3 8 0 11s8 3 11 0-3-11-11-11z" stroke="#E8728A" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 15l-7 7 2 2 7-7" stroke="#E8728A" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="20" cy="10" r="1.5" fill="#E8728A"/></svg> },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 0.08}>
                <div className="group h-full rounded-[20px] border border-[rgba(26,26,46,0.08)] bg-white p-6 pb-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-10px_rgba(26,26,46,0.12)]">
                  <div className="mb-4 text-5xl leading-none text-[#E8728A]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, fontFeatureSettings: '"lnum"' }}>{step.num}</div>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDEEF1]">{step.icon}</div>
                  <h3 className="mb-2.5 text-2xl leading-tight text-[#1A1A2E]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[hsl(240,10%,46%)]">{step.text}</p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#E8728A]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {step.time}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 12 METRICS ───────────────────────────────────────────── */}
      <section className="overflow-hidden py-28 sm:py-36" id="metrics" style={{ background: "#FAF4EE" }}>
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mb-16 max-w-[720px]">
            <Reveal>
              <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(240,10%,46%)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                <span className="h-px w-6 bg-[#E8728A]" />{t("landing.metrics_label", "The science surface")}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-4 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.01em] text-[#1A1A2E]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                {t("landing.metrics_title_1", "Twelve things we measure,")}<br />{t("landing.metrics_title_2", "so you don\u2019t have to")} <em className="not-italic text-[#E8728A]" style={{ fontWeight: 400 }}>{t("landing.metrics_title_3", "guess.")}</em>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-[hsl(240,10%,46%)]">
                {t("landing.metrics_subtitle", "Each metric has a clinical proxy \u2014 hydration tracks stratum-corneum moisture cues, barrier tracks transepidermal water-loss indicators, and so on. Scores are 0\u2013100, relative to your demographic cohort.")}
              </p>
            </Reveal>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {METRICS.map((m, i) => (
              <Reveal key={m.name} delay={(i % 4) * 0.04}>
                <div className="group cursor-default rounded-[18px] border border-[rgba(26,26,46,0.08)] bg-white p-5 transition-all duration-300 hover:-translate-y-[3px] hover:border-[#E8728A] hover:shadow-[0_14px_30px_-10px_rgba(26,26,46,0.10)]">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAFAFB]">
                    <MetricIcon index={i} />
                  </div>
                  <h3 className="mb-1.5 text-[22px] leading-tight text-[#1A1A2E]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}>{m.name}</h3>
                  <p className="mb-4 min-h-[3em] text-[12.5px] leading-normal text-[hsl(240,10%,46%)]">{m.desc}</p>
                  <div className="h-[3px] overflow-hidden rounded-full bg-[rgba(26,26,46,0.08)]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: tierColor(m.tier) }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.fill}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-sans)", color: tierColor(m.tier) }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: tierColor(m.tier) }} />
                    Score {m.fill}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-10 inline-flex items-center gap-2.5 text-xs tracking-wide text-[hsl(240,10%,46%)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
              <span className="h-px w-5 bg-[rgba(26,26,46,0.14)]" />
              {t("landing.metrics_methodology", "Methodology and confidence intervals published quarterly \u00b7 last update April 2026")}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── LIVE DEMO ────────────────────────────────────────────── */}
      <section className="overflow-hidden py-28 sm:py-36" id="demo" style={{ background: "#1A1A2E", color: "#F4EEE8" }}>
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mb-16 max-w-[720px]">
            <Reveal>
              <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(244,238,232,0.65)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                <span className="h-px w-6 bg-[#F4A7B9]" />{t("landing.demo_label", "See one in action")}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-4 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.01em] text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                {t("landing.demo_title_1", "Watch the scan")}<br />{t("landing.demo_title_2", "think out")} <em className="not-italic text-[#F4A7B9]" style={{ fontWeight: 400 }}>{t("landing.demo_title_3", "loud.")}</em>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 text-[17px] leading-relaxed text-[rgba(244,238,232,0.65)]">
                {t("landing.demo_subtitle", "Here\u2019s a real analysis running \u2014 three regions of interest, bars filling as the model resolves each metric. Your scan looks exactly like this.")}
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.16}>
            <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 sm:p-8">
              <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
                {/* Face stage */}
                <div className="relative overflow-hidden rounded-3xl" style={{ aspectRatio: "4/5", background: "linear-gradient(160deg, #3A2A3E 0%, #6B4A5B 50%, #B77A8A 100%)" }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                  {/* Face silhouette */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 300 380" style={{ width: "70%", height: "70%" }}>
                      <ellipse cx="150" cy="190" rx="80" ry="120" fill="#F4A7B9" opacity="0.55" />
                      <ellipse cx="128" cy="180" rx="4" ry="3" fill="#1A1A2E" opacity="0.6" />
                      <ellipse cx="172" cy="180" rx="4" ry="3" fill="#1A1A2E" opacity="0.6" />
                      <path d="M134 240 Q150 250 166 240" stroke="#1A1A2E" strokeWidth="1.2" fill="none" opacity="0.55" />
                    </svg>
                  </div>
                  {/* Scan overlay */}
                  <div className="absolute inset-0 animate-[scanSweep_3.2s_ease-in-out_infinite]" style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(232,114,138,0.25) 50%, transparent 100%)", backgroundSize: "100% 30%", backgroundRepeat: "no-repeat" }} />
                  {/* Target dots */}
                  {[
                    { pos: "top-[28%] left-[32%]", anim: "floatA_6s" },
                    { pos: "top-[46%] right-[28%]", anim: "floatB_5s" },
                    { pos: "bottom-[26%] left-[38%]", anim: "floatA_7s" },
                  ].map((td, i) => (
                    <div key={i} className={`absolute ${td.pos} flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-[rgba(244,238,232,0.6)] animate-[${td.anim}_ease-in-out_infinite]`}>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E8728A] shadow-[0_0_0_4px_rgba(232,114,138,0.3)]" />
                    </div>
                  ))}
                </div>

                {/* Readout rows */}
                <div className="flex flex-col gap-3.5">
                  {[
                    { zone: "Forehead · Hydration", value: 82, fill: 82, tier: "good" },
                    { zone: "Cheeks · Barrier integrity", value: 64, fill: 64, tier: "mid" },
                    { zone: "Nose · Redness index", value: 41, fill: 41, tier: "alert" },
                    { zone: "Overall · Even tone", value: 78, fill: 78, tier: "good" },
                  ].map((row) => (
                    <div key={row.zone} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4 sm:p-5 transition-colors hover:bg-[rgba(255,255,255,0.06)]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[rgba(244,238,232,0.6)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{row.zone}</div>
                          <div className="flex items-baseline gap-1.5 text-[28px] text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}>
                            {row.value} <span className="text-[11px] tracking-wider text-[rgba(244,238,232,0.5)]" style={{ fontFamily: "var(--font-dm-sans)" }}>/100</span>
                          </div>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            background: `${tierColor(row.tier)}20`,
                            color: row.tier === "good" ? "#8EC4B5" : row.tier === "mid" ? "#E5BE83" : "#F29BAC",
                          }}
                        >
                          {tierLabel(row.tier)}
                        </span>
                      </div>
                      <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: tierColor(row.tier) }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.fill}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demo CTA */}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.08)] pt-8">
                <p className="text-xl italic text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                  {t("landing.demo_time_1", "This scan took")} <em className="not-italic text-[#F4A7B9]">{t("landing.demo_time_2", "6.8 seconds.")}</em> {t("landing.demo_time_3", "Yours will too.")}
                </p>
                <Link href={scanHref} className="inline-flex items-center gap-2.5 rounded-full bg-[#E8728A] px-5 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-[#D45571] hover:shadow-[0_10px_28px_rgba(232,114,138,0.28)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {t("landing.demo_cta", "Try it on your face")}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── PRODUCTS / RECOMMENDATIONS ───────────────────────────── */}
      <section className="py-28 sm:py-36" id="products" style={{ background: "#FAFAFB" }}>
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mb-16 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(240,10%,46%)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  <span className="h-px w-6 bg-[#E8728A]" />{t("landing.products_label", "Curated, not catalogued")}
                </span>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="mt-4 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.01em] text-[#1A1A2E]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                  {t("landing.products_title_1", "Products matched")}<br />{t("landing.products_title_2", "to")} <em className="not-italic text-[#E8728A]" style={{ fontWeight: 400 }}>{t("landing.products_title_3", "your")}</em> {t("landing.products_title_4", "skin.")}
                </h2>
              </Reveal>
            </div>
            <Reveal delay={0.16}>
              <p className="max-w-[58ch] text-[17px] leading-relaxed text-[hsl(240,10%,46%)]">
                {t("landing.products_subtitle", "Our AI matches HL/Skin products to your exact metrics. Each recommendation comes with ingredient breakdowns and routine placement.")}
              </p>
            </Reveal>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 0.04}>
                <div className="group flex h-full flex-col rounded-[20px] border border-[rgba(26,26,46,0.08)] bg-white p-4 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_36px_-10px_rgba(26,26,46,0.10)]">
                  {/* Product image area */}
                  <div className="relative flex items-center justify-center overflow-hidden rounded-[14px] border border-[rgba(26,26,46,0.06)] bg-white" style={{ aspectRatio: "1" }}>
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-[#FAFAFB] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1A1A2E]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {product.category}
                    </span>
                    {product.type === "ingestible" && (
                      <span className="absolute right-3 top-3 rounded-full bg-[#1A1A2E] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {t("landing.products_supplement", "Supplement")}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="pt-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[hsl(240,10%,46%)]" style={{ fontFamily: "var(--font-dm-sans)" }}>HL/Skin · {product.sku}</div>
                    <h4 className="-mt-0.5 text-[19px] leading-tight text-[#1A1A2E]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}>{product.name.replace("HL/Skin ", "").replace("Herbalife ", "")}</h4>
                  </div>
                  <p className="text-[12.5px] leading-normal text-[hsl(240,10%,46%)]">
                    <strong className="font-medium text-[#1A1A2E]">{product.benefits[0]}</strong>
                  </p>
                  {/* Concern tags */}
                  <div className="mt-auto flex flex-wrap gap-1.5 border-t border-[rgba(26,26,46,0.08)] pt-3">
                    {product.concerns.slice(0, 3).map((c) => (
                      <span key={c} className="rounded-full bg-[#FDEEF1] px-2 py-0.5 text-[10px] font-medium text-[#D45571]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {c.replace(/_/g, " ")}
                      </span>
                    ))}
                    {product.size && (
                      <span className="rounded-full bg-[#EEF1F0] px-2 py-0.5 text-[10px] font-medium text-[#1A1A2E]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {product.size.split(" / ")[0]}
                      </span>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <Reveal>
            <div className="mt-12 flex justify-center">
              <Link href={scanHref} className="inline-flex items-center gap-2.5 rounded-full bg-[#1A1A2E] px-6 py-3.5 text-sm font-medium text-[#F4EEE8] transition-all hover:-translate-y-px hover:bg-[#2A2A42] hover:shadow-[0_10px_28px_rgba(26,26,46,0.22)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {t("landing.products_cta", "Get your personalized routine")}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── INGREDIENT SCIENCE ───────────────────────────────────── */}
      <section className="overflow-hidden py-28 sm:py-36" id="science" style={{ background: "#1A1A2E", color: "#F4EEE8" }}>
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mb-16 max-w-[720px]">
            <Reveal>
              <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(244,238,232,0.65)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                <span className="h-px w-6 bg-[#F4A7B9]" />{t("landing.science_label", "The ingredient layer")}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-4 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.01em] text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                {t("landing.science_title_1", "We rank molecules,")}<br />{t("landing.science_title_2", "not")} <em className="not-italic text-[#F4A7B9]" style={{ fontWeight: 400 }}>{t("landing.science_title_3", "marketing.")}</em>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 text-[17px] leading-relaxed text-[rgba(244,238,232,0.65)]">
                {t("landing.science_subtitle", "Every product is broken down to its active ingredients, cross-referenced against your metrics. Three we lean on the most \u2014 and why.")}
              </p>
            </Reveal>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { name: "Niacinamide", inci: "INCI \u00b7 Nicotinamide \u00b7 Vit. B3", formula: "C\u2086H\u2086N\u2082O", desc: t("landing.science_niacinamide_desc", "The ingredient that quietly fixes four things at once: strengthens ceramide synthesis, calms redness, regulates sebum, and softens hyperpigmentation. Works at 2\u20135%."), targets: "Barrier \u00b7 Redness", evidence: "42 RCTs" },
              { name: "Bakuchiol", inci: "INCI \u00b7 Meroterpene \u00b7 Plant-derived", formula: "C\u2081\u2088H\u2082\u2084O", desc: t("landing.science_bakuchiol_desc", "The retinol alternative your barrier can tolerate. Up-regulates collagen expression without the peeling, photo-sensitivity or pregnancy caveats of tretinoin."), targets: "Fine lines \u00b7 Tone", evidence: "18 clinical studies" },
              { name: "Tranexamic Acid", inci: "INCI \u00b7 Trans-4-aminomethyl", formula: "C\u2088H\u2081\u2085NO\u2082", desc: t("landing.science_tranexamic_desc", "The gold standard for stubborn melasma and post-inflammatory pigmentation. Interrupts the melanocyte-keratinocyte pathway \u2014 without irritating a sensitive barrier."), targets: "Pigmentation", evidence: "27 peer-reviewed papers" },
            ].map((ing, i) => (
              <Reveal key={ing.name} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-7 sm:p-8 transition-all duration-300 hover:-translate-y-[3px] hover:border-[rgba(232,114,138,0.4)] hover:bg-[rgba(255,255,255,0.06)]">
                  <div className="mb-7 text-[11px] tracking-[0.2em] text-[#F4A7B9]" style={{ fontFamily: "var(--font-dm-sans)" }}>{ing.formula}</div>
                  <h3 className="mb-1.5 text-[28px] leading-tight text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}>{ing.name}</h3>
                  <div className="mb-4 text-[11px] uppercase tracking-[0.14em] text-[#F4A7B9]" style={{ fontFamily: "var(--font-dm-sans)" }}>{ing.inci}</div>
                  <p className="mb-5 text-sm leading-relaxed text-[rgba(244,238,232,0.78)]">{ing.desc}</p>
                  <div className="grid grid-cols-2 gap-3 border-t border-[rgba(255,255,255,0.08)] pt-5">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[rgba(244,238,232,0.55)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{t("landing.science_targets", "Targets")}</div>
                      <div className="mt-1 text-xl text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}>{ing.targets}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[rgba(244,238,232,0.55)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{t("landing.science_evidence", "Evidence")}</div>
                      <div className="mt-1 text-xl text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}><span className="text-[#F4A7B9]">{ing.evidence.split(" ")[0]}</span> {ing.evidence.split(" ").slice(1).join(" ")}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Stats footer */}
          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-[rgba(255,255,255,0.08)] pt-12 sm:grid-cols-4">
            {[
              { n: "4,200+", l: t("landing.science_stat1", "Products in our graph") },
              { n: "312", l: t("landing.science_stat2", "Actives ranked by efficacy") },
              { n: "0", l: t("landing.science_stat3", "Affiliate placements. Ever.") },
              { n: "Q", l: t("landing.science_stat4", "Quarterly methodology refresh") },
            ].map((stat) => (
              <Reveal key={stat.n}>
                <div>
                  <div className="text-5xl leading-none text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                    <span className="text-[#F4A7B9]">{stat.n}</span>
                  </div>
                  <div className="mt-2.5 max-w-[22ch] text-[11px] uppercase leading-normal tracking-[0.14em] text-[rgba(244,238,232,0.6)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{stat.l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────── */}
      <section className="overflow-hidden py-28 sm:py-36" id="pricing" style={{ background: "#FAF4EE" }}>
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mx-auto mb-16 max-w-[680px] text-center">
            <Reveal>
              <span className="inline-flex items-center justify-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(240,10%,46%)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                <span className="h-px w-6 bg-[#E8728A]" />{t("landing.pricing_label", "Pricing")}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-4 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.01em] text-[#1A1A2E]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                {t("landing.pricing_title_1", "Free to")} <em className="not-italic text-[#E8728A]" style={{ fontWeight: 400 }}>{t("landing.pricing_title_2", "scan.")}</em><br />{t("landing.pricing_title_3", "Always.")}
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mx-auto mt-5 max-w-[58ch] text-[17px] leading-relaxed text-[hsl(240,10%,46%)]">
                {t("landing.pricing_subtitle", "Your first scan and your first plan are free \u2014 forever. If you want history, trends, and on-demand scans, there\u2019s a plan for that.")}
              </p>
            </Reveal>
          </div>

          <div className="mx-auto grid max-w-[1100px] gap-4 lg:grid-cols-3">
            {[
              { name: t("landing.plan_free_name", "Free"), desc: t("landing.plan_free_desc", "One scan. One plan. No card needed. Ever."), price: "$0", cadence: "", sub: t("landing.plan_free_sub", "Forever \u00b7 no trial expiry"), features: [t("landing.plan_free_f1", "One complete 12-metric scan"), t("landing.plan_free_f2", "Plain-English skin report"), t("landing.plan_free_f3", "5-product routine, matched"), t("landing.plan_free_f4", "Daily skincare reminders")], cta: t("landing.plan_free_cta", "Start free"), featured: false },
              { name: t("landing.plan_plus_name", "Plus"), desc: t("landing.plan_plus_desc", "Scan anytime. Track changes. Rebalance your routine as your skin shifts."), price: "$9", cadence: "/ month", sub: t("landing.plan_plus_sub", "or $79/yr \u00b7 cancel anytime"), features: [t("landing.plan_plus_f1", "Unlimited scans"), t("landing.plan_plus_f2", "12-month trend tracking"), t("landing.plan_plus_f3", "Weekly routine auto-tuning"), t("landing.plan_plus_f4", "Ingredient deep-dives"), t("landing.plan_plus_f5", "Shopping list sync")], cta: t("landing.plan_plus_cta", "Go Plus"), featured: true, badge: t("landing.plan_plus_badge", "Most loved") },
              { name: t("landing.plan_pro_name", "Pro"), desc: t("landing.plan_pro_desc", "For estheticians, content creators, and anyone running skin journeys for clients."), price: "$29", cadence: "/ month", sub: t("landing.plan_pro_sub", "team pricing available"), features: [t("landing.plan_pro_f1", "Everything in Plus"), t("landing.plan_pro_f2", "Up to 25 client profiles"), t("landing.plan_pro_f3", "Before/after export (PDF)"), t("landing.plan_pro_f4", "White-label report covers"), t("landing.plan_pro_f5", "API access (500 scans/mo)")], cta: t("landing.plan_pro_cta", "Talk to sales"), featured: false },
            ].map((plan) => (
              <Reveal key={plan.name}>
                <div className={`relative flex h-full flex-col rounded-3xl border p-7 sm:p-8 transition-transform duration-300 ${
                  plan.featured
                    ? "scale-[1.03] border-[#1A1A2E] bg-[#1A1A2E] text-[#F4EEE8]"
                    : "border-[rgba(26,26,46,0.08)] bg-white"
                }`}>
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E8728A] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white" style={{ fontFamily: "var(--font-dm-sans)" }}>{plan.badge}</span>
                  )}
                  <h3 className={`text-[28px] ${plan.featured ? "text-[#F4EEE8]" : "text-[#1A1A2E]"}`} style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}>{plan.name}</h3>
                  <p className={`mb-6 min-h-[3em] text-[13px] leading-relaxed ${plan.featured ? "text-[rgba(244,238,232,0.65)]" : "text-[hsl(240,10%,46%)]"}`}>{plan.desc}</p>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className={`text-[56px] leading-none ${plan.featured ? "text-[#F4EEE8]" : "text-[#1A1A2E]"}`} style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>{plan.price}</span>
                    {plan.cadence && <span className={`text-[13px] ${plan.featured ? "text-[rgba(244,238,232,0.6)]" : "text-[hsl(240,10%,46%)]"}`} style={{ fontFamily: "var(--font-dm-sans)" }}>{plan.cadence}</span>}
                  </div>
                  <div className={`mb-7 text-xs ${plan.featured ? "text-[rgba(244,238,232,0.6)]" : "text-[hsl(240,10%,46%)]"}`} style={{ fontFamily: "var(--font-dm-sans)" }}>{plan.sub}</div>
                  <ul className="mb-8 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className={`relative pl-6 text-[13.5px] leading-relaxed ${plan.featured ? "text-[rgba(244,238,232,0.85)]" : "text-[#1A1A2E]"}`}>
                        <span className={`absolute left-0 top-2 h-2 w-3.5 -rotate-45 border-b-[1.5px] border-l-[1.5px] ${plan.featured ? "border-[#F4A7B9]" : "border-[#5B9A8B]"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={scanHref}
                    className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium transition-all hover:-translate-y-px ${
                      plan.featured
                        ? "bg-[#E8728A] text-white hover:bg-[#D45571] hover:shadow-[0_10px_28px_rgba(232,114,138,0.28)]"
                        : "border-[1.5px] border-[rgba(26,26,46,0.14)] text-[#1A1A2E] hover:border-[#1A1A2E]"
                    }`}
                    style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="mt-8 text-center text-xs tracking-wide text-[hsl(240,10%,46%)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {t("landing.pricing_disclaimer", "Prices in USD. No hidden fees. You own your scan data \u2014 export or delete anytime.")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ background: "#1A1A2E", color: "#F4EEE8" }} className="pb-10 pt-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="grid gap-12 border-b border-[rgba(255,255,255,0.08)] pb-16 sm:grid-cols-2 lg:grid-cols-[2.2fr_1fr_1fr_1fr]">
            {/* Brand column */}
            <div>
              <Link href="/" className="flex items-center gap-2" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, fontSize: 22 }}>
                <Image src="/logo-new.svg" alt="" width={28} height={28} className="brightness-0 invert" />
                <span className="flex items-center text-[#F4EEE8]">
                  Beauty <span className="px-[0.12em] italic text-[#F4A7B9]" style={{ fontWeight: 400 }}>&amp;</span> Glow
                  <span className="mx-2 inline-block h-[0.7em] w-px bg-current opacity-35" />
                  <span className="text-[0.38em] tracking-[0.14em] text-[#F4A7B9]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500, transform: "translateY(-0.4em)" }}>AI</span>
                </span>
              </Link>
              <h4 className="my-5 max-w-[15ch] text-4xl leading-tight text-[#F4EEE8]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}>
                {t("landing.footer_tagline_1", "Your skin,")} <em className="not-italic text-[#F4A7B9]" style={{ fontWeight: 400 }}>{t("landing.footer_tagline_2", "quantified")}</em> {t("landing.footer_tagline_3", "softly.")}
              </h4>
              <p className="max-w-[36ch] text-sm leading-relaxed text-[rgba(244,238,232,0.65)]">
                {t("footer.disclaimer", "This tool is intended only for cosmetic awareness purposes. Results are not a substitute for professional dermatological advice.")}
              </p>
            </div>

            {/* Product column */}
            <div>
              <h5 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(244,238,232,0.5)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{t("landing.footer_col_product", "Product")}</h5>
              <ul className="space-y-3">
                {[
                  { label: t("landing.footer_how", "How it works"), href: "#how" },
                  { label: t("landing.footer_metrics", "The 12 metrics"), href: "#metrics" },
                  { label: t("landing.footer_demo", "Live demo"), href: "#demo" },
                  { label: t("landing.footer_products", "Products"), href: "#products" },
                  { label: t("landing.footer_pricing", "Pricing"), href: "#pricing" },
                ].map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-[13px] text-[rgba(244,238,232,0.85)] transition-colors hover:text-[#F4A7B9]" style={{ fontFamily: "var(--font-dm-sans)" }}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick links */}
            <div>
              <h5 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(244,238,232,0.5)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{t("landing.footer_col_links", "Quick links")}</h5>
              <ul className="space-y-3">
                {[
                  { label: t("landing.footer_scan", "Scan my skin"), href: scanHref },
                  { label: t("landing.footer_config", "Configuration"), href: configHref },
                  { label: t("landing.footer_privacy", "Privacy policy"), href: "/privacy" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[13px] text-[rgba(244,238,232,0.85)] transition-colors hover:text-[#F4A7B9]" style={{ fontFamily: "var(--font-dm-sans)" }}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Science column */}
            <div>
              <h5 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(244,238,232,0.5)]" style={{ fontFamily: "var(--font-dm-sans)" }}>{t("landing.footer_col_science", "Science")}</h5>
              <ul className="space-y-3">
                {[
                  { label: t("landing.footer_ingredient", "Ingredient science"), href: "#science" },
                  { label: t("landing.footer_methodology", "Methodology"), href: "#science" },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[13px] text-[rgba(244,238,232,0.85)] transition-colors hover:text-[#F4A7B9]" style={{ fontFamily: "var(--font-dm-sans)" }}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-8 text-xs text-[rgba(244,238,232,0.55)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            <div>&copy; {new Date().getFullYear()} Beauty &amp; Glow AI</div>
            <div className="flex gap-6">
              <Link href="/privacy" className="transition-colors hover:text-[#F4EEE8]">{t("landing.footer_privacy_link", "Privacy")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
