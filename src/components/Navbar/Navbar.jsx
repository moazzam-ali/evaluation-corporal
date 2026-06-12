"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LANGUAGES } from "@/lib/languages";

const languages = LANGUAGES;

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isScanPage = pathname === "/scan";
  const isLanding = pathname === "/";

  const paramString = searchParams.toString();
  const scanHref = paramString ? `/scan?${paramString}` : "/scan";
  const configHref = paramString ? `/config?${paramString}` : "/config";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
    setMobileLangOpen(false);
  };

  const navLinks = isLanding
    ? [
        { label: t("landing.nav_metrics", "Metrics"), href: "#metrics" },
        { label: t("landing.nav_how", "How it works"), href: "#how" },
        { label: t("landing.nav_science", "Science"), href: "#science" },
      ]
    : [
        { label: t("nav.home", "Home"), href: "/" },
        { label: t("nav.scan", "Start Scan"), href: scanHref },
        { label: t("nav.config", "Config"), href: configHref },
      ];

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b bg-[rgba(244,239,231,0.92)]"
          : "bg-[rgba(244,239,231,0.82)]"
      }`}
      style={{
        borderColor: scrolled ? "rgba(47,47,43,0.06)" : "transparent",
        backdropFilter: "saturate(180%) blur(18px)",
        WebkitBackdropFilter: "saturate(180%) blur(18px)",
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
        {/* Brand lockup */}
        <Link href="/" className="inline-flex items-center gap-2.5 shrink-0">
          <Image src="/logo.png" alt="Evaluación Corporal" width={32} height={32} className="w-8 h-8 shrink-0 object-contain" priority />
          <span
            className="whitespace-nowrap"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontSize: "20px", color: "var(--ink, #2F2F2B)", letterSpacing: "-0.01em", lineHeight: 1 }}
          >
            {t("nav.brand", "Evaluación Corporal")}
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-9 lg:flex" style={{ fontFamily: "var(--font-inter)", fontSize: 13.5, fontWeight: 500 }}>
          {navLinks.map((link) =>
            link.href.startsWith("#") ? (
              <a key={link.href} href={link.href} className="transition-colors hover:text-[var(--ink)]" style={{ color: "var(--muted-fg)" }}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-[var(--ink)]" style={{ color: "var(--muted-fg)" }}>
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {isScanPage && (
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2"
              style={{ background: "var(--status-good-bg, #EAEFE6)", color: "var(--status-good-hex, #8D9A84)", fontFamily: "var(--font-inter)", fontSize: "12px", fontWeight: 500 }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-good-hex)", boxShadow: "0 0 0 3px rgba(46,139,107,0.25)" }} />
              {t("nav.saved", "Saved automatically")}
            </span>
          )}

          <Link
            href={scanHref}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] text-white transition-all hover:-translate-y-px hover:shadow-[var(--shadow-blue)]"
            style={{ background: "var(--ink, #2F2F2B)", fontFamily: "var(--font-inter)", fontWeight: 500 }}
          >
            {t("landing.cta", "Start Free Scan")}
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </Link>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 rounded-full border px-3 py-2 text-xs transition-colors hover:border-[var(--border-strong)]"
              style={{ borderColor: "var(--border-hex, #E4D9C6)", color: "var(--muted-fg)" }}
              aria-label={t("nav.aria_change_language", "Change language")}
            >
              <Globe className="h-3.5 w-3.5" />
              {i18n.language?.toUpperCase().slice(0, 2)}
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border bg-white shadow-lg" style={{ borderColor: "var(--border-hex)" }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--canvas)] first:rounded-t-xl last:rounded-b-xl"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "13px",
                      color: i18n.language === lang.code ? "var(--ink)" : "var(--muted-fg)",
                      fontWeight: i18n.language === lang.code ? 600 : 400,
                    }}
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={t("nav.aria_toggle_menu", "Toggle navigation menu")}
          style={{ color: "var(--ink)" }}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden"
          style={{ borderTop: "1px solid rgba(47,47,43,0.06)", background: "rgba(244,239,231,0.98)" }}
        >
          <div className="mx-auto max-w-[1280px] px-5 py-5 flex flex-col gap-1">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-[15px] transition-colors hover:bg-[rgba(47,47,43,0.04)]"
                  style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--ink)" }}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-[15px] transition-colors hover:bg-[rgba(47,47,43,0.04)]"
                  style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--ink)" }}
                >
                  {link.label}
                </Link>
              )
            )}

            {/* Expandable language section */}
            <div className="mt-1 border-t pt-2" style={{ borderColor: "rgba(47,47,43,0.06)" }}>
              <button
                onClick={() => setMobileLangOpen(!mobileLangOpen)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[15px] transition-colors hover:bg-[rgba(47,47,43,0.04)]"
                style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--ink)" }}
              >
                <span className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4" style={{ color: "var(--muted-fg)" }} />
                  {t("nav.language", "Language")}
                  <span className="text-xs font-normal" style={{ color: "var(--muted-fg)" }}>({i18n.language?.toUpperCase().slice(0, 2)})</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileLangOpen ? "rotate-180" : ""}`} style={{ color: "var(--muted-fg)" }} />
              </button>
              {mobileLangOpen && (
                <div className="ml-4 mt-1 flex flex-wrap gap-2 px-4 pb-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguage(lang.code); setMobileMenuOpen(false); }}
                      className="rounded-full px-3 py-1.5 text-xs transition-colors"
                      style={{
                        fontFamily: "var(--font-inter)",
                        background: i18n.language === lang.code ? "var(--ink)" : "transparent",
                        color: i18n.language === lang.code ? "white" : "var(--muted-fg)",
                        border: i18n.language === lang.code ? "1px solid var(--ink)" : "1px solid var(--border-hex)",
                        fontWeight: i18n.language === lang.code ? 600 : 400,
                      }}
                    >
                      {lang.nativeLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile CTA */}
            <div className="mt-3 border-t pt-4 px-4" style={{ borderColor: "rgba(47,47,43,0.06)" }}>
              <Link
                href={scanHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition-all hover:shadow-[var(--shadow-blue)]"
                style={{ background: "var(--ink)", fontFamily: "var(--font-inter)" }}
              >
                {t("landing.cta", "Start Free Scan")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
