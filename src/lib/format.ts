export function formatMemoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isBangla(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

export function excerpt(text: string, length = 90): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= length ? clean : `${clean.slice(0, length).trimEnd()}…`;
}
