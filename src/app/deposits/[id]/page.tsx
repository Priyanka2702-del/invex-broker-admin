"use client";
import { use } from "react";
import TransactionDetails from "@/components/admin/TransactionDetails";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TransactionDetails kind="deposit" id={id} />;
}
