"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer style={{ borderTop: "1px solid var(--border-hex, #E4D9C6)", background: "var(--canvas, #F4EFE7)" }}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "var(--muted-fg, #6B5B4B)" }}>
            &copy; {new Date().getFullYear()} {t("nav.brand", "Nutritional")}. {t("footer.rights", "All rights reserved.")}
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "var(--muted-fg, #6B5B4B)", transition: "color 200ms" }}>
              {t("footer.privacy", "Privacy Policy")}
            </Link>
          </div>
        </div>
        <p style={{
          marginTop: "16px", textAlign: "center",
          fontFamily: "var(--font-inter)", fontSize: "11px", color: "var(--muted-fg, #6B5B4B)",
          letterSpacing: "0.04em", lineHeight: 1.6,
        }}>
          {t("footer.disclaimer")}
        </p>
      </div>
    </footer>
  );
}
