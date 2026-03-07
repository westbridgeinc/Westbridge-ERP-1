/**
 * Ensures translation files stay in sync.
 * Fails when es.json or fr.json is missing keys that exist in en.json.
 *
 * Run: npx vitest lib/i18n/validate-translations.test.ts
 */
import { describe, it, expect } from "vitest";
import enMessages from "../../messages/en.json";
import esMessages from "../../messages/es.json";
import frMessages from "../../messages/fr.json";

type MessageRecord = Record<string, Record<string, string>>;

function getAllLeafKeys(obj: MessageRecord, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [section, values] of Object.entries(obj)) {
    for (const key of Object.keys(values)) {
      keys.push(prefix ? `${prefix}.${section}.${key}` : `${section}.${key}`);
    }
  }
  return keys;
}

const enKeys = getAllLeafKeys(enMessages as MessageRecord);

describe("i18n translation completeness", () => {
  it("es.json has all keys from en.json", () => {
    const esKeys = new Set(getAllLeafKeys(esMessages as MessageRecord));
    const missing = enKeys.filter((k) => !esKeys.has(k));
    expect(missing, `Missing in es.json: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("fr.json has all keys from en.json", () => {
    const frKeys = new Set(getAllLeafKeys(frMessages as MessageRecord));
    const missing = enKeys.filter((k) => !frKeys.has(k));
    expect(missing, `Missing in fr.json: ${missing.join(", ")}`).toHaveLength(0);
  });
});
