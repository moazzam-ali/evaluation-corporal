import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin, logoutAdmin } from "@/lib/admin-auth";
import { Package, KeyRound, LogOut } from "lucide-react";

async function logoutAction() {
  "use server";
  await logoutAdmin();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }) {
  // Layout is rendered for all /admin/* routes including login.
  // The login page itself doesn't require auth — handled per-page.
  const admin = await getCurrentAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      {admin && (
        <nav className="border-b bg-background">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/admin/products" className="text-sm font-bold">
              Evaluación Corporal Admin
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/admin/products"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Package className="h-4 w-4" />
                Products
              </Link>
              <Link
                href="/admin/account"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <KeyRound className="h-4 w-4" />
                Account
              </Link>
              <span className="text-xs text-muted-foreground">{admin.email}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </button>
              </form>
            </div>
          </div>
        </nav>
      )}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
