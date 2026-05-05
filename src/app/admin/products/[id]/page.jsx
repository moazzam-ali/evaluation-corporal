import { redirect, notFound } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getProductById } from "@/lib/products";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return <ProductForm initial={product} />;
}
