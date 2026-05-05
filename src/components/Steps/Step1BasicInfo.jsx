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
          <label className="scan-label">{t("scan.step1.name", "First name")} <span className="text-[#E8728A] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="Sofía" {...register("name")} />
          {errors.name && <p className="scan-error">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.surname", "Last name")} <span className="text-[#E8728A] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="Marín" {...register("surname")} />
          {errors.surname && <p className="scan-error">{errors.surname.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step1.email", "Email")} <span className="text-[#E8728A] text-sm">*</span></label>
        <input className="scan-input" type="email" placeholder="sofia@example.com" {...register("email")} />
        <span className="scan-help">{t("scan.step1.email_help", "We email your full report and routine here. Never used for marketing.")}</span>
        {errors.email && <p className="scan-error">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.birthDate", "Date of birth")} <span className="text-[#E8728A] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="DD / MM / YYYY" maxLength={10} onInput={handleBirthDateInput} {...register("birthDate")} />
          {errors.birthDate && <p className="scan-error">{errors.birthDate.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.phone", "Phone")} <span className="text-[#E8728A] text-sm">*</span></label>
          <input className="scan-input" type="tel" placeholder="+34 612 345 678" {...register("phone")} />
          {errors.phone && <p className="scan-error">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.country", "Country")} <span className="text-[#E8728A] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="Spain" {...register("country")} />
          {errors.country && <p className="scan-error">{errors.country.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.city", "City")} <span className="text-[#E8728A] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="Madrid" {...register("city")} />
          {errors.city && <p className="scan-error">{errors.city.message}</p>}
        </div>
      </div>
    </div>
  );
}
