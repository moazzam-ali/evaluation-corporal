"use client";

export default function Step7FinalSubmission({ form, t }) {
  const { getValues } = form;
  const values = getValues();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[rgba(47,47,43,0.10)] bg-[#F8F6F2] p-5">
        <h3 className="text-[15px] font-semibold mb-2" style={{ color: "var(--ink)", fontFamily: "var(--font-inter)" }}>
          {t("scan.step7.title", "Ready to send?")}
        </h3>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted-fg)", fontFamily: "var(--font-inter)" }}>
          {t("scan.step7.description", "Review your information and make sure everything is correct.")}
        </p>
      </div>

      <div className="rounded-xl border border-[rgba(47,47,43,0.10)] bg-white p-5">
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted-fg)", fontFamily: "var(--font-inter)" }}>
          {t("scan.step7.note", "Before submitting, ensure that all the data you have provided is accurate.")}
        </p>
      </div>

      <div className="rounded-xl border border-[rgba(155,133,115,0.2)] bg-[#EFE7DC] px-5 py-4">
        <p className="text-[13px] leading-relaxed" style={{ color: "#6B5B4B", fontFamily: "var(--font-inter)" }}>
          {t("scan.step7.tip", "Check your email ({{email}}) and phone number ({{phone}}) for possible errors.", {
            email: values.email || "—",
            phone: values.phone || "—",
          })}
        </p>
      </div>
    </div>
  );
}
