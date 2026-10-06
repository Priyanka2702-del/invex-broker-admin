"use client";
import { use } from "react";
import TradeDetails from "@/components/admin/TradeDetails";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TradeDetails tradeId={id} />;
}
