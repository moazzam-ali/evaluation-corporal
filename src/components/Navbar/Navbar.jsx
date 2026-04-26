"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LANGUAGES } from "@/lib/languages";

const languages = LANGUAGES;

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const pathname = usePathname();
  const isScanPage = pathname === "/scan";

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(251, 246, 241, 0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(26, 26, 46, 0.10)",
      }}
    >
      <div className="mx-auto flex items-center justify-between gap-6 px-8 max-w-[1280px]" style={{ padding: "18px 32px" }}>
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

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          {/* Saved automatically pill (shown during scan) */}
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
            href="/"
            className="transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#6B6B7A" }}
            onMouseEnter={(e) => (e.target.style.color = "#1A1A2E")}
            onMouseLeave={(e) => (e.target.style.color = "#6B6B7A")}
          >
            {t("nav.home", "Home")}
          </Link>
          <Link
            href="/scan"
            className="transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#6B6B7A" }}
            onMouseEnter={(e) => (e.target.style.color = "#1A1A2E")}
            onMouseLeave={(e) => (e.target.style.color = "#6B6B7A")}
          >
            {t("nav.scan", "Scan")}
          </Link>
          <Link
            href="/config"
            className="transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#6B6B7A" }}
            onMouseEnter={(e) => (e.target.style.color = "#1A1A2E")}
            onMouseLeave={(e) => (e.target.style.color = "#6B6B7A")}
          >
            {t("nav.config", "Config")}
          </Link>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label="Change language"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "#6B6B7A", border: "1px solid rgba(26, 26, 46, 0.10)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1A2E")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B7A")}
            >
              <Globe className="h-4 w-4" />
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
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          style={{ color: "#1A1A2E" }}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="px-4 py-4 md:hidden" style={{ borderTop: "1px solid rgba(26,26,46,0.10)", background: "rgba(251,246,241,0.95)" }}>
          <div className="flex flex-col gap-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "14px", color: "#1A1A2E" }}>
              {t("nav.home", "Home")}
            </Link>
            <Link href="/scan" onClick={() => setMobileMenuOpen(false)} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "14px", color: "#1A1A2E" }}>
              {t("nav.scan", "Scan")}
            </Link>
            <Link href="/config" onClick={() => setMobileMenuOpen(false)} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "14px", color: "#1A1A2E" }}>
              {t("nav.config", "Config")}
            </Link>
            <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid rgba(26,26,46,0.10)" }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { changeLanguage(lang.code); setMobileMenuOpen(false); }}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    background: i18n.language === lang.code ? "#1A1A2E" : "transparent",
                    color: i18n.language === lang.code ? "white" : "#6B6B7A",
                    border: i18n.language === lang.code ? "1px solid #1A1A2E" : "1px solid rgba(26,26,46,0.16)",
                  }}
                >
                  {lang.nativeLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
