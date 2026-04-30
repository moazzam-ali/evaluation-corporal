"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer style={{ borderTop: "1px solid rgba(26,26,46,0.10)", background: "#FBF6F1" }}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#6B6B7A" }}>
            &copy; {new Date().getFullYear()} Beauty &amp; Glow AI. {t("footer.rights", "All rights reserved.")}
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#6B6B7A", transition: "color 180ms" }}>
              {t("footer.privacy", "Privacy Policy")}
            </Link>
          </div>
        </div>
        <p style={{
          marginTop: "16px", textAlign: "center",
          fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#6B6B7A",
          letterSpacing: "0.04em", lineHeight: 1.6,
        }}>
          {t("footer.disclaimer", "This tool is intended only for cosmetic awareness purposes. Results are not a substitute for professional dermatological advice.")}
        </p>
      </div>
    </footer>
  );
}
