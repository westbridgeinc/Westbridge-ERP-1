"use client";

/**
 * Conditionally renders children based on the current user's permissions.
 *
 * @example
 * <PermissionGate permission="invoices:write" role={session.role}>
 *   <CreateInvoiceButton />
 * </PermissionGate>
 *
 * <PermissionGate permission="billing:manage" role={session.role} fallback={<UpgradePrompt />}>
 *   <BillingSettings />
 * </PermissionGate>
 */
import type { ReactNode } from "react";
import { hasPermission } from "@/lib/rbac";
import type { Permission } from "@/lib/rbac";

interface PermissionGateProps {
  /** The permission required to see the children. */
  permission: Permission;
  /** The current user's role. */
  role: string;
  /** Rendered when the permission check fails. Defaults to null. */
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  role,
  fallback = null,
  children,
}: PermissionGateProps) {
  if (!hasPermission(role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
