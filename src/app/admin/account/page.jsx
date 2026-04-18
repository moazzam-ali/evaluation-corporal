import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import PasswordChangeForm from "@/components/admin/PasswordChangeForm";

export default async function AdminAccountPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="max-w-md">
      <h1 className="mb-1 text-2xl font-bold">Account</h1>
      <p className="mb-6 text-sm text-muted-foreground">{admin.email}</p>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold">Change password</h2>
        <PasswordChangeForm />
      </div>
    </div>
  );
}
