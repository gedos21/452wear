"use client";

import type { Currency } from "@/types/product";

/**
 * Sipariş ARAYÜZÜ — henüz bir backend'e bağlı değil, bu yüzden `useOrders()`
 * boş liste döner ve arayüz boş durumu gösterir. Uydurma sipariş üretmiyoruz.
 *
 * Sipariş servisi bağlandığında yalnızca bu dosya değişecek.
 */

export type OrderStatus = "preparing" | "shipped" | "delivered";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
};

export type OrderLine = {
  productId: string;
  name: string;
  color: string;
  size: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  /** ISO tarih */
  placedAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  total: number;
  currency: Currency;
};

export function useOrders(): { orders: Order[]; loading: boolean } {
  return { orders: [], loading: false };
}
