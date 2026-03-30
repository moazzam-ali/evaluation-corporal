"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SkinCamera from "@/components/SkinCamera/SkinCamera";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  surname: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Invalid phone number"),
  age: z.coerce.number().min(15).max(120),
  skin_type: z.enum(["oily", "dry", "combination", "normal", "sensitive"]),
});

const skinTypeOptions = ["oily", "dry", "combination", "normal", "sensitive"];

export default function ScanPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imageData, setImageData] = useState(null);
  const [activeTab, setActiveTab] = useState("camera");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const chatIDs = searchParams.get("n")?.split(",").filter(Boolean) || [];
  const botIndex = searchParams.get("b") || "1";
  const accountIDs = searchParams.get("a")?.split(",").filter(Boolean) || [];
  const contactIDs = searchParams.get("c")?.split(",").filter(Boolean) || [];
  const lang = searchParams.get("l") || i18n.language || "en";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      phone: "",
      age: "",
      skin_type: "normal",
    },
  });

  const onSubmit = async (formData) => {
    if (!imageData) {
      toast.error(t("scan.no_face", "Please capture or upload a photo first."));
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      const submitData = new FormData();
      submitData.append("image", blob, "skin-photo.jpg");
      submitData.append("formData", JSON.stringify(formData));
      submitData.append("chatIDs", JSON.stringify(chatIDs));
      submitData.append("botIndex", botIndex);
      submitData.append("accountIDs", JSON.stringify(accountIDs));
      submitData.append("contactIDs", JSON.stringify(contactIDs));
      submitData.append("lng", lang);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: submitData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Analysis failed");
      }

      toast.success(t("results.title", "Analysis complete!"));
      router.push(`/results/${result.id}`);
    } catch (error) {
      toast.error(error.message || t("common.error"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold">{t("scan.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("scan.subtitle")}</p>
      </motion.div>

      {isAnalyzing ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="relative mb-6">
            <div className="h-24 w-24 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <p className="text-lg font-medium">{t("scan.analyzing")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("scan.subtitle")}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Camera */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SkinCamera
              onImageCapture={setImageData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t("scan.enter_details")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("scan.name")}</Label>
                      <Input id="name" {...register("name")} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surname">{t("scan.surname")}</Label>
                      <Input id="surname" {...register("surname")} />
                      {errors.surname && <p className="text-xs text-destructive">{errors.surname.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("scan.email")}</Label>
                    <Input id="email" type="email" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("scan.phone")}</Label>
                      <Input id="phone" {...register("phone")} placeholder="+1234567890" />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">{t("scan.age")}</Label>
                      <Input id="age" type="number" {...register("age")} />
                      {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skin_type">{t("scan.skin_type")}</Label>
                    <select
                      id="skin_type"
                      {...register("skin_type")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {skinTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {t(`scan.skin_types.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={!imageData || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    {t("scan.analyze_btn")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
