export function parseValue(value: number | string): { num: number; suffix: string } {
  if (typeof value === "number") return { num: value, suffix: "" };
  const match = String(value).match(/^([\d.]+)(.*)$/);
  if (!match) return { num: 0, suffix: String(value) };
  return { num: parseFloat(match[1]) || 0, suffix: match[2] || "" };
}
