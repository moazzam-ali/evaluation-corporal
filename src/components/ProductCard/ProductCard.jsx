"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Image from "next/image";

export default function ProductCard({ product, delay = 0 }) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  const isIngestible = product.type === "ingestible";
  const showImage = product.image && !imgError;
  const topIngredients = product.keyIngredients?.slice(0, 3) || [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex flex-col overflow-hidden"
      style={{
        background: "white",
        border: "1px solid rgba(47,47,43,0.10)",
        borderRadius: "20px",
        transition: "transform 280ms cubic-bezier(0.22,1,0.36,1), box-shadow 280ms",
      }}
      whileHover={{ y: -3, boxShadow: "0 14px 32px rgba(47,47,43,0.10)" }}
    >
      {/* Image area */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4 / 3",
          background: isIngestible
            ? "linear-gradient(160deg, #F5EBD5 0%, #C7A977 100%)"
            : "linear-gradient(160deg, #EFE7DC 0%, #CDBFAE 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {showImage ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ width: "96px", height: "96px", color: "rgba(255,255,255,0.6)" }}>
            {isIngestible ? (
              <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M10.5 3.5L3.5 10.5a4.95 4.95 0 0 0 7 7l7-7a4.95 4.95 0 0 0-7-7z"/><path opacity="0.4" d="M10.5 3.5L7 7l7 7 3.5-3.5a4.95 4.95 0 0 0-7-7z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0z" opacity="0.6"/></svg>
            )}
          </span>
        )}

        {/* Priority badge */}
        {product.priority && (
          <span
            className="absolute top-4 left-0 inline-flex items-center gap-1.5"
            style={{
              padding: "5px 12px", background: "#2F2F2B", color: "white",
              fontFamily: "var(--font-dm-sans)", fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              borderRadius: "0 999px 999px 0",
            }}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            #{product.priority} {t("products.pick", "pick")}
          </span>
        )}

        {/* Category pill */}
        <span
          className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5"
          style={{
            background: isIngestible ? "rgba(199,169,119,0.94)" : "rgba(255,255,255,0.94)",
            color: isIngestible ? "white" : "#2F2F2B",
            padding: "5px 10px", borderRadius: "999px",
            fontFamily: "var(--font-dm-sans)", fontSize: "10px", fontWeight: 500,
            letterSpacing: "0.04em", backdropFilter: "blur(6px)",
          }}
        >
          {isIngestible ? (
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.5 3.5L3.5 10.5a4.95 4.95 0 0 0 7 7l7-7a4.95 4.95 0 0 0-7-7z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0z"/></svg>
          )}
          {isIngestible ? t("products.supplement", "Supplement") : t(`products.categories.${product.category}`, product.category)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 flex-1" style={{ padding: "18px 20px 20px" }}>
        <div className="flex flex-col gap-0.5">
          <h3 style={{ fontFamily: "var(--font-dm-sans)", fontSize: "14.5px", fontWeight: 600, margin: 0, color: "#2F2F2B", lineHeight: 1.3 }}>
            {product.name}
          </h3>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#6B5B4B" }}>
            {product.size}
          </span>
        </div>

        {product.reason && (
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A42", lineHeight: 1.55, margin: 0 }}>
            {product.reason}
          </p>
        )}

        {/* Key ingredient pills */}
        {topIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topIngredients.map((ing, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setShowIngredients(!showIngredients)}
                className="inline-flex items-center gap-1"
                style={{
                  background: "#EFE7DC", color: "#2F2F2B",
                  padding: "4px 10px", borderRadius: "999px",
                  fontFamily: "var(--font-dm-sans)", fontSize: "11px", fontWeight: 500,
                  border: "1px solid rgba(47,47,43,0.10)", cursor: "pointer",
                }}
              >
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#9B8573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v6L4 17a3 3 0 0 0 3 4h10a3 3 0 0 0 3-4l-5-9V2"/><line x1="9" y1="2" x2="15" y2="2"/></svg>
                {ing.name?.split("(")[0].trim()}
              </button>
            ))}
          </div>
        )}

        {/* Expandable ingredient details */}
        <AnimatePresence>
          {showIngredients && product.keyIngredients?.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 rounded-xl p-3" style={{ background: "#F8F6F2" }}>
                {product.keyIngredients.slice(0, 4).map((ing, i) => (
                  <p key={i} style={{ fontSize: "11px", lineHeight: 1.5, color: "#6B5B4B", margin: 0 }}>
                    <span style={{ fontWeight: 600, color: "#2F2F2B" }}>{ing.name}</span>
                    <span style={{ margin: "0 4px", color: "rgba(47,47,43,0.16)" }}>—</span>
                    {ing.role}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How to use */}
        {product.howToUse && (
          <div
            className="flex gap-2 items-start mt-auto"
            style={{ background: "#F8F6F2", borderRadius: "10px", padding: "10px 12px" }}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#9B8573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#6B5B4B", lineHeight: 1.5 }}>
              {product.howToUse}
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
}
