"use client";

export default function Step1PersonalInfo({ form, t }) {
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
          <label className="scan-label">{t("scan.step1.name", "Name")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder={t("scan.step1.name", "Name")} {...register("name")} />
          {errors.name && <p className="scan-error">{t("validation.personal.name_required", errors.name.message)}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.surname", "Surname")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder={t("scan.step1.surname", "Surname")} {...register("surname")} />
          {errors.surname && <p className="scan-error">{t("validation.personal.surname_required", errors.surname.message)}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step1.email", "Email")} <span className="text-[#2C5BFF] text-sm">*</span></label>
        <input className="scan-input" type="email" placeholder="sofia@example.com" {...register("email")} />
        <span className="scan-help">{t("scan.step1.disclaimer", "We will send your report directly to your WhatsApp. Please verify that your phone number is correct.")}</span>
        {errors.email && <p className="scan-error">{t("validation.personal.email_invalid", errors.email.message)}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.birth_date", "Date of birth")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder="DD / MM / YYYY" maxLength={10} onInput={handleBirthDateInput} {...register("birthDate")} />
          {errors.birthDate && <p className="scan-error">{t("validation.personal.birth_date_required", errors.birthDate.message)}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.phone", "Phone number")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="tel" placeholder={t("scan.step1.phone_placeholder", "+34 612 345 678")} {...register("phone")} />
          {errors.phone && <p className="scan-error">{t("validation.personal.phone_invalid", errors.phone.message)}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step1.country", "Country")} <span className="text-[#2C5BFF] text-sm">*</span></label>
        <input className="scan-input" type="text" placeholder={t("scan.step1.country", "Country")} {...register("country")} />
        {errors.country && <p className="scan-error">{t("validation.personal.country_required", errors.country.message)}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.province", "State/Province")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder={t("scan.step1.province", "State/Province")} {...register("province")} />
          {errors.province && <p className="scan-error">{t("validation.personal.province_required", errors.province.message)}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step1.city", "City")} <span className="text-[#2C5BFF] text-sm">*</span></label>
          <input className="scan-input" type="text" placeholder={t("scan.step1.city", "City")} {...register("city")} />
          {errors.city && <p className="scan-error">{t("validation.personal.city_required", errors.city.message)}</p>}
        </div>
      </div>
    </div>
  );
}
