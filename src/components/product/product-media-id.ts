/**
 * Ürün kartı ile detay panelinin paylaştığı layout animasyonu kimliği.
 * İki taraf da bu fonksiyonu kullanır ki kimlikler asla ayrışmasın.
 */
export const productMediaLayoutId = (productId: string) =>
  `product-media-${productId}`;
