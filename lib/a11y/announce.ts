/**
 * Programmatic screen reader announcements via an aria-live region.
 * Call announce() from anywhere in the app to surface status changes to screen readers.
 *
 * @example
 * announce("Invoice created successfully", "polite");
 * announce("Session expired. Please log in again.", "assertive");
 */

const REGION_ID = "wb-sr-announcer";

function getOrCreateRegion(politeness: "polite" | "assertive"): HTMLElement {
  let el = document.getElementById(REGION_ID) as HTMLElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = REGION_ID;
    el.setAttribute("aria-live", politeness);
    el.setAttribute("aria-atomic", "true");
    el.setAttribute("aria-relevant", "additions text");
    el.style.cssText =
      "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Announce a message to screen readers.
 * @param message  The text to announce.
 * @param politeness  "polite" (wait for silence) or "assertive" (interrupt immediately).
 */
export function announce(
  message: string,
  politeness: "polite" | "assertive" = "polite"
): void {
  if (typeof document === "undefined") return;
  const region = getOrCreateRegion(politeness);
  // Clear then set to ensure the announcement fires even for repeated messages
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
