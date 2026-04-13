"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Step1BasicInfo({ form, t }) {
  const { register, formState: { errors } } = form;

  // Auto-format birthDate as DD/MM/YYYY
  const handleBirthDateInput = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + "/" + val.slice(5);
    if (val.length > 10) val = val.slice(0, 10);
    e.target.value = val;
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{t("scan.step1.title", "Basic Information")}</h2>
      <p className="text-sm text-muted-foreground">{t("scan.step1.subtitle", "Tell us about yourself")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("scan.step1.name", "First Name")}</Label>
          <Input {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("scan.step1.surname", "Last Name")}</Label>
          <Input {...register("surname")} />
          {errors.surname && <p className="text-xs text-destructive">{errors.surname.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("scan.step1.email", "Email")}</Label>
        <Input type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("scan.step1.birthDate", "Date of Birth")}</Label>
          <Input {...register("birthDate")} placeholder="DD/MM/YYYY" onInput={handleBirthDateInput} />
          {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("scan.step1.phone", "Phone")}</Label>
          <Input {...register("phone")} placeholder="+34612345678" />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("scan.step1.country", "Country")}</Label>
          <Input {...register("country")} />
          {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("scan.step1.city", "City")}</Label>
          <Input {...register("city")} />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>
      </div>
    </div>
  );
}
