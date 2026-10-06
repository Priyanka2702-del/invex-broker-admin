"use client";
import { use } from "react";
import UserProfile from "@/components/admin/UserProfile";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <UserProfile userId={id} />;
}
