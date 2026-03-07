"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useErpDoc(doctype: string, name: string | null) {
  return useQuery({
    queryKey: ["erp", doctype, name],
    queryFn: () => api.erp.get(doctype, name!),
    staleTime: 60_000,
    enabled: !!doctype && !!name,
  });
}
