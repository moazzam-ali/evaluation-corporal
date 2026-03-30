"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import Loader from "@/components/Loader/Loader";

export default function I18nProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), 10000);

    if (i18n.isInitialized) {
      setIsReady(true);
      clearTimeout(timeout);
    } else {
      i18n.on("initialized", () => {
        setIsReady(true);
        clearTimeout(timeout);
      });
    }

    return () => clearTimeout(timeout);
  }, []);

  if (!isReady) return <Loader />;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
