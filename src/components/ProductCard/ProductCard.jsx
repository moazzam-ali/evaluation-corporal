"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

export default function ProductCard({ product, delay = 0 }) {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === "es";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
          <ShoppingBag className="h-16 w-16 text-primary/30" />
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">
              {isSpanish ? product.name_es : product.name}
            </h3>
            {product.priority && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                #{product.priority}
              </Badge>
            )}
          </div>
          <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
            {isSpanish ? product.description_es : product.description}
          </p>
          {product.reason && (
            <div className="mb-3 rounded-md bg-muted/50 p-2">
              <p className="text-xs">
                <span className="font-medium">{t("products.reason")}: </span>
                {product.reason}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">{product.price}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
