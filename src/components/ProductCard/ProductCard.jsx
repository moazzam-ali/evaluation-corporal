"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Droplets, Pill, Sparkles, FlaskConical, ChevronRight } from "lucide-react";

export default function ProductCard({ product, delay = 0, rank }) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  const isIngestible = product.type === "ingestible";
  const showImage = product.image && !imgError;
  const topIngredients = product.keyIngredients?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Priority rank indicator */}
        {product.priority && (
          <div className="absolute left-0 top-5 z-10 flex items-center gap-1.5 rounded-r-full bg-primary px-3 py-1 shadow-md">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
            <span className="text-[11px] font-semibold text-primary-foreground">
              #{product.priority} {t("products.pick", "Pick")}
            </span>
          </div>
        )}

        {/* Image area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted/50 to-accent/5">
          {showImage ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              {isIngestible ? (
                <Pill className="h-16 w-16 text-secondary/30" />
              ) : (
                <Droplets className="h-16 w-16 text-primary/15" />
              )}
            </div>
          )}

          {/* Category pill — bottom of image */}
          <div className="absolute bottom-3 right-3">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-md ${
              isIngestible
                ? "bg-secondary/90 text-white"
                : "bg-white/90 text-foreground"
            }`}>
              {isIngestible ? (
                <Pill className="h-2.5 w-2.5" />
              ) : (
                <Droplets className="h-2.5 w-2.5" />
              )}
              {isIngestible ? t("products.supplement", "Supplement") : product.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name + size */}
          <h3 className="text-sm font-bold leading-snug">{product.name}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{product.size}</p>

          {/* AI reason — the star of the card */}
          {product.reason && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {product.reason}
            </p>
          )}

          {/* Key ingredients as compact pills */}
          {topIngredients.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topIngredients.map((ing, i) => (
                <button
                  key={i}
                  onClick={() => setShowIngredients(!showIngredients)}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-accent hover:bg-accent/10 hover:text-foreground"
                >
                  <FlaskConical className="h-2.5 w-2.5" />
                  {ing.name.split("(")[0].trim()}
                </button>
              ))}
            </div>
          )}

          {/* Expandable ingredient details */}
          <AnimatePresence>
            {showIngredients && topIngredients.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-1.5 rounded-lg bg-muted/30 p-3">
                  {product.keyIngredients.slice(0, 4).map((ing, i) => (
                    <p key={i} className="text-[11px] leading-snug text-muted-foreground">
                      <span className="font-semibold text-foreground">{ing.name}</span>
                      <span className="mx-1 text-border">—</span>
                      {ing.role}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* How to use — subtle hint */}
          {product.howToUse && (
            <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-accent/5 px-3 py-2">
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent-foreground/50" />
              <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                {product.howToUse}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
