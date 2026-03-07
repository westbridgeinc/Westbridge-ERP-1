/**
 * Product analytics tracker.
 * Privacy-compliant: respects Do Not Track header.
 * Sends events to /api/analytics/track (or external provider if configured).
 *
 * @example
 * analytics.track("invoice.created", { invoiceId, amount });
 * analytics.identify(userId, { plan, companyName });
 * analytics.page("/dashboard/invoices");
 */

function doNotTrack(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.doNotTrack === "1" || (window as { doNotTrack?: string }).doNotTrack === "1";
}

function send(payload: Record<string, unknown>): void {
  if (doNotTrack()) return;
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/track", JSON.stringify(payload));
  }
}

let _userId: string | null = null;
let _accountId: string | null = null;

export const analytics = {
  /** Identify the current user. Call after login. */
  identify(userId: string, traits: Record<string, unknown> = {}): void {
    _userId = userId;
    _accountId = (traits.accountId as string) ?? null;
    send({ event: "identify", userId, traits, timestamp: new Date().toISOString() });
  },

  /** Track a discrete action. */
  track(event: string, properties: Record<string, unknown> = {}): void {
    send({
      event,
      properties,
      userId: _userId,
      accountId: _accountId,
      timestamp: new Date().toISOString(),
    });
  },

  /** Track a page view. */
  page(path: string, properties: Record<string, unknown> = {}): void {
    send({
      event: "page",
      path,
      properties,
      userId: _userId,
      accountId: _accountId,
      timestamp: new Date().toISOString(),
    });
  },

  /** Reset identity on logout. */
  reset(): void {
    _userId = null;
    _accountId = null;
  },
};
