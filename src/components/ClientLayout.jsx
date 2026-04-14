"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import I18nProvider from "@/components/i18nProvider";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <I18nProvider>
      <div className="flex min-h-screen flex-col">
        {!isLanding && <Navbar />}
        <main className="flex-1">{children}</main>
        {!isLanding && <Footer />}
      </div>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
    </I18nProvider>
  );
}
