"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Sparkles, BarChart3, ArrowRight } from "lucide-react";

const metricsList = [
  "oily_skin", "moisture", "texture", "wrinkles", "dark_circles", "redness",
  "pores", "firmness", "radiance", "acne", "dark_spots", "eye_area",
];

const steps = [
  { icon: Camera, key: "step1" },
  { icon: Sparkles, key: "step2" },
  { icon: BarChart3, key: "step3" },
];

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("landing.trusted_by")}
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("landing.hero_title")}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            {t("landing.hero_subtitle")}
          </p>
          <Link href="/scan">
            <Button size="lg" className="gap-2 text-base px-8 py-6">
              {t("landing.cta")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 text-center text-3xl font-bold"
        >
          {t("landing.how_it_works")}
        </motion.h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className="relative overflow-hidden border-0 bg-muted/50 transition-shadow hover:shadow-lg">
                <CardContent className="flex flex-col items-center p-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {t(`landing.${step.key}_title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`landing.${step.key}_desc`)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl font-bold"
          >
            {t("landing.metrics_title")}
          </motion.h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {metricsList.map((metric, i) => (
              <motion.div
                key={metric}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-0 bg-background transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-bold text-primary">{i + 1}</span>
                    </div>
                    <span className="text-sm font-medium">{t(`metrics.${metric}`)}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl px-4"
        >
          <h2 className="mb-6 text-3xl font-bold">{t("landing.cta")}</h2>
          <Link href="/scan">
            <Button size="lg" className="gap-2 px-8 py-6 text-base">
              {t("landing.cta")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
