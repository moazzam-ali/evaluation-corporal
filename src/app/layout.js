import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

// Body / UI typeface — Montserrat covers what Inter and DM Sans used to do.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

// Display / titles — Cormorant Garamond replaces Fraunces.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

// Reuse Montserrat for label/eyebrow variable previously bound to DM Sans.
const montserratLabel = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata = {
  title: "Evaluación Corporal — Body & Nutrition Assessment",
  description: "AI-powered body composition analysis, nutrition planning, and wellness coaching by Evaluación Corporal.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${cormorant.variable} ${montserratLabel.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
