"use client";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ErpListParams } from "@/lib/api/client";

const DEFAULT_PAGE = 0;

export function useErpList(doctype: string, params?: ErpListParams) {
  const page = params?.page ?? DEFAULT_PAGE;
  const queryParams = { ...params, page };
  const query = useQuery({
    queryKey: ["erp", doctype, queryParams],
    queryFn: () => api.erp.list(doctype, queryParams),
    staleTime: 2 * 60_000,       // 2 min — avoid re-fetching on every navigation
    gcTime: 5 * 60_000,          // 5 min — keep cache alive while switching pages
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,  // don't refetch when user tabs back
    enabled: !!doctype,
  });
  const response = query.data;
  return {
    ...query,
    data: response?.data ?? [],
    hasMore: response?.meta?.hasMore ?? false,
    page: response?.meta?.page ?? page,
    pageSize: response?.meta?.pageSize ?? 20,
  };
}
