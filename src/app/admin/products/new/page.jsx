import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return <ProductForm isNew />;
}
