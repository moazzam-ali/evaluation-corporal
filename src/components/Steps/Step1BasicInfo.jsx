"use client";

export default function Step1BasicInfo({ form, t }) {
  const { register, formState: { errors } } = form;

  const handleBirthDateInput = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + "/" + val.slice(5);
    if (val.length > 10) val = val.slice(0, 10);
    e.target.value = val;
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.name", "First name")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="Sofía" {...register("name")} />
          {errors.name && <p className="scan-error">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.surname", "Last name")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="Marín" {...register("surname")} />
          {errors.surname && <p className="scan-error">{errors.surname.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step1.email", "Email")} <span className="text-[#2C5BFF] text-sm">*</span></label>
        <input className="scan-input" type="email" placeholder="sofia@example.com" {...register("email")} />
        <span className="scan-help">{t("scan.step1.email_help", "We email your full report and routine here. Never used for marketing.")}</span>
        {errors.email && <p className="scan-error">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.birthDate", "Date of birth")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="DD / MM / YYYY" maxLength={10} onInput={handleBirthDateInput} {...register("birthDate")} />
          {errors.birthDate && <p className="scan-error">{errors.birthDate.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.phone", "Phone")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="tel" placeholder="+34 612 345 678" {...register("phone")} />
          {errors.phone && <p className="scan-error">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.country", "Country")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="Spain" {...register("country")} />
          {errors.country && <p className="scan-error">{errors.country.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.city", "City")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="Madrid" {...register("city")} />
          {errors.city && <p className="scan-error">{errors.city.message}</p>}
        </div>
      </div>
      {/* GDPR Consent */}
      <div className="flex items-start gap-3 rounded-xl border border-[rgba(11,27,51,0.10)] bg-[#F8FAFE] p-4">
        <input
          type="checkbox"
          id="consent"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#2C5BFF] cursor-pointer"
          {...register("consent")}
        />
        <label htmlFor="consent" className="text-[12.5px] leading-relaxed text-[#44444F] cursor-pointer" style={{ fontFamily: "var(--font-dm-sans)" }}>
          {t("scan.step1.consent_text", "I agree that my personal data (including my photo) will be processed by AI to generate a skin analysis. Results will be stored and shared with my coach.")}
          {" "}
          <a href="/privacy" target="_blank" className="text-[#2C5BFF] underline underline-offset-2 hover:text-[#1F44CC]">
            {t("scan.step1.consent_link", "Read our Privacy Policy")}
          </a>
          {" "}
          <span className="text-[#2C5BFF]">*</span>
        </label>
      </div>
      {errors.consent && <p className="scan-error">{errors.consent.message}</p>}
    </div>
  );
}
