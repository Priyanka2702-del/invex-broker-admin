"use client";
import { use } from "react";
import IBTable from "@/components/admin/IBTable";

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <IBTable slug={slug} />;
}
