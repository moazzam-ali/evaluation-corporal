import productData from "@/data/products.json";
import metricProductMap from "@/data/metric-product-map.json";

export const PRODUCT_CATALOG = productData;

export function getProducts() {
  return PRODUCT_CATALOG;
}

export function getProductById(id) {
  return PRODUCT_CATALOG.find((p) => p.id === id);
}

export function getProductsByConcern(concernId) {
  return PRODUCT_CATALOG.filter((p) => p.concerns.includes(concernId));
}

export function getProductsForMetrics(metrics) {
  const scored = new Map();

  for (const metric of metrics) {
    if (metric.score >= 80) continue;

    const productIds = metricProductMap[metric.id];
    if (!productIds) continue;

    const weight = metric.score < 40 ? 3 : metric.score < 60 ? 2 : 1;

    for (const pid of productIds) {
      scored.set(pid, (scored.get(pid) || 0) + weight);
    }
  }

  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id], i) => {
      const product = getProductById(id);
      if (!product) return null;
      return { ...product, priority: i + 1 };
    })
    .filter(Boolean);
}

export function getProductsForRecommendations(recommendations) {
  if (!recommendations || !Array.isArray(recommendations)) return [];

  return recommendations
    .map((rec) => {
      const product = getProductById(rec.product_id);
      if (!product) return null;
      return { ...product, priority: rec.priority, reason: rec.reason };
    })
    .filter(Boolean);
}
