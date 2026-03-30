"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">HL</span>
          </div>
          <span className="text-lg font-semibold">{t("nav.brand", "HL/Skin")}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t("nav.home", "Home")}
          </Link>
          <Link href="/scan" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t("nav.scan", "Scan")}
          </Link>

          {/* Language selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
            >
              <Globe className="h-4 w-4" />
            </Button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-md border bg-background shadow-lg">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-accent ${
                      i18n.language === lang.code ? "font-semibold text-primary" : "text-foreground"
                    }`}
                  >
                    {lang.label}
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
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm">
              {t("nav.home", "Home")}
            </Link>
            <Link href="/scan" onClick={() => setMobileMenuOpen(false)} className="text-sm">
              {t("nav.scan", "Scan")}
            </Link>
            <div className="flex gap-2 pt-2 border-t">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { changeLanguage(lang.code); setMobileMenuOpen(false); }}
                  className={`text-xs px-3 py-1 rounded-full border ${
                    i18n.language === lang.code ? "bg-primary text-primary-foreground border-primary" : "border-border"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
