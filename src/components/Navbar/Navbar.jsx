"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
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

  // Close mobile menu on route change
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
        { label: t("landing.nav_how", "How it works"), href: "#how" },
        { label: t("landing.nav_metrics", "Metrics"), href: "#metrics" },
        { label: t("landing.nav_demo", "Live demo"), href: "#demo" },
        { label: t("landing.nav_products", "Products"), href: "#products" },
        { label: t("landing.nav_pricing", "Pricing"), href: "#pricing" },
      ]
    : [
        { label: t("nav.home", "Home"), href: "/" },
        { label: t("nav.scan", "Scan"), href: scanHref },
        { label: t("nav.config", "Config"), href: configHref },
      ];

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-[rgba(26,26,46,0.08)] bg-[rgba(250,250,251,0.92)]"
          : "bg-[rgba(250,250,251,0.82)]"
      }`}
      style={{ backdropFilter: "saturate(180%) blur(18px)", WebkitBackdropFilter: "saturate(180%) blur(18px)" }}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
        {/* Brand lockup */}
        <Link href="/" className="inline-flex items-center gap-3 shrink-0">
          <Image src="/logo-new.svg" alt="" width={32} height={32} className="w-8 h-8 shrink-0" />
          <span
            className="inline-flex items-baseline gap-1.5 whitespace-nowrap"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 300, fontSize: "20px", color: "#1A1A2E" }}
          >
            Beauty &amp; Glow
            <span
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "#E8728A",
                padding: "2px 6px",
                border: "1px solid rgba(232,114,138,0.3)",
                borderRadius: "4px",
                lineHeight: 1,
              }}
            >
              AI
            </span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-7 lg:flex" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500 }}>
          {navLinks.map((link) =>
            link.href.startsWith("#") ? (
              <a key={link.href} href={link.href} className="text-[hsl(240,10%,46%)] transition-colors hover:text-[#1A1A2E]">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="text-[hsl(240,10%,46%)] transition-colors hover:text-[#1A1A2E]">
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
              style={{ background: "#E6F1ED", color: "#5B9A8B", fontFamily: "var(--font-dm-sans)", fontSize: "12px", fontWeight: 500 }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#5B9A8B", boxShadow: "0 0 0 3px rgba(91,154,139,0.25)" }} />
              {t("nav.saved", "Saved automatically")}
            </span>
          )}

          <Link
            href={configHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,26,46,0.14)] bg-transparent px-4 py-2 text-xs text-[hsl(240,10%,46%)] transition-colors hover:border-[#1A1A2E] hover:text-[#1A1A2E]"
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

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 rounded-full border border-[hsl(340,15%,90%)] px-3 py-2 text-xs text-[hsl(240,10%,46%)] transition-colors hover:border-[#1A1A2E]/30 hover:text-[#1A1A2E]"
              aria-label={t("nav.aria_change_language", "Change language")}
            >
              <Globe className="h-3.5 w-3.5" />
              {i18n.language?.toUpperCase().slice(0, 2)}
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border bg-white shadow-lg" style={{ borderColor: "rgba(26,26,46,0.10)" }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#F6EDE3] first:rounded-t-xl last:rounded-b-xl"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "13px",
                      color: i18n.language === lang.code ? "#1A1A2E" : "#6B6B7A",
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
          style={{ color: "#1A1A2E" }}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden"
          style={{ borderTop: "1px solid rgba(26,26,46,0.08)", background: "rgba(250,250,251,0.98)" }}
        >
          <div className="mx-auto max-w-[1280px] px-5 py-5 flex flex-col gap-1">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-[15px] text-[#1A1A2E] transition-colors hover:bg-[rgba(26,26,46,0.04)]"
                  style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-[15px] text-[#1A1A2E] transition-colors hover:bg-[rgba(26,26,46,0.04)]"
                  style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
                >
                  {link.label}
                </Link>
              )
            )}

            {/* Expandable language section */}
            <div className="mt-1 border-t border-[rgba(26,26,46,0.08)] pt-2">
              <button
                onClick={() => setMobileLangOpen(!mobileLangOpen)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[15px] text-[#1A1A2E] transition-colors hover:bg-[rgba(26,26,46,0.04)]"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
              >
                <span className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-[#6B6B7A]" />
                  {t("nav.language", "Language")}
                  <span className="text-xs text-[#6B6B7A] font-normal">({i18n.language?.toUpperCase().slice(0, 2)})</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-[#6B6B7A] transition-transform duration-200 ${mobileLangOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileLangOpen && (
                <div className="ml-4 mt-1 flex flex-wrap gap-2 px-4 pb-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguage(lang.code); setMobileMenuOpen(false); }}
                      className="rounded-full px-3 py-1.5 text-xs transition-colors"
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        background: i18n.language === lang.code ? "#1A1A2E" : "transparent",
                        color: i18n.language === lang.code ? "white" : "#6B6B7A",
                        border: i18n.language === lang.code ? "1px solid #1A1A2E" : "1px solid rgba(26,26,46,0.16)",
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
            <div className="mt-3 border-t border-[rgba(26,26,46,0.08)] pt-4 px-4">
              <Link
                href={scanHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E8728A] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#D45571]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {t("landing.cta", "Scan My Skin")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
