"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Beauty &amp; Glow AI. {t("footer.rights", "All rights reserved.")}
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("footer.privacy", "Privacy Policy")}
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("footer.disclaimer", "This tool is intended only for cosmetic awareness purposes. Results are not a substitute for professional dermatological advice.")}
        </p>
      </div>
    </footer>
  );
}
