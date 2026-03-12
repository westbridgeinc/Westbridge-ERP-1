export const dynamic = "force-dynamic";

import { FileText } from "lucide-react";
import { serverErpList } from "@/lib/api/server";
import type { CurrencyCode } from "@/lib/constants";
import { ListPageError } from "../_components/ListPageError";
import { InvoicesListClient } from "./_components/InvoicesListClient";
import type { InvoiceRow } from "./_components/InvoicesListClient";

/* ---------- ERP mappers ---------- */

function mapErpInvoice(d: Record<string, unknown>): InvoiceRow {
  const name = (d.name as string) ?? "";
  const customer = (d.customer_name as string) ?? (d.customer as string) ?? "\u2014";
  const amount = Number(d.grand_total ?? d.outstanding_amount ?? 0);
  const currency = ((d.currency as string) ?? "USD") as CurrencyCode;
  const status = String(d.status ?? "Draft").trim();
  const date = (d.posting_date as string) ?? "";
  const dueDate = (d.due_date as string) ?? "";
  return { id: name, customer, amount, currency, status, date, dueDate };
}

function mapErpSalesOrder(d: Record<string, unknown>): InvoiceRow {
  const name = (d.name as string) ?? "";
  const customer = (d.customer_name as string) ?? (d.customer as string) ?? "\u2014";
  const amount = Number(d.grand_total ?? d.net_total ?? 0);
  const currency = ((d.currency as string) ?? "USD") as CurrencyCode;
  const status = String(d.status ?? "Draft").trim();
  const date = (d.transaction_date as string) ?? "";
  const dueDate = (d.delivery_date as string) ?? "";
  return { id: name, customer, amount, currency, status, date, dueDate };
}

/* ---------- Page (async Server Component) ---------- */

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "0");
  const type = params.type ?? "invoice";
  const isOrder = type === "order";
  const doctype = isOrder ? "Sales Order" : "Sales Invoice";
  const mapper = isOrder ? mapErpSalesOrder : mapErpInvoice;

  let invoices: InvoiceRow[] = [];
  let currentPage = page;
  let hasMore = false;
  let error: string | null = null;

  try {
    const result = await serverErpList(doctype, { page });
    invoices = (result.data as Record<string, unknown>[]).map(mapper);
    currentPage = result.meta.page;
    hasMore = result.meta.hasMore;
  } catch (err) {
    error = err instanceof Error ? err.message : `Failed to load ${doctype.toLowerCase()}s.`;
  }

  if (error) {
    return (
      <ListPageError
        title={isOrder ? "Sales Orders" : "Invoices"}
        subtitle={isOrder ? "Manage and track sales orders" : "Manage and track invoices"}
        error={error}
        icon={<FileText className="h-6 w-6" />}
        createHref="/dashboard/invoices/new"
      />
    );
  }

  return (
    <InvoicesListClient
      invoices={invoices}
      currentPage={currentPage}
      hasMore={hasMore}
      title={isOrder ? "Sales Orders" : "Invoices"}
      subtitle={isOrder ? "Manage and track sales orders" : "Manage and track invoices"}
      dateLabel={isOrder ? "Order Date" : "Date"}
      dueDateLabel={isOrder ? "Delivery Date" : "Due Date"}
      searchPlaceholder={isOrder ? "Search orders..." : "Search invoices..."}
      type={type}
    />
  );
}
