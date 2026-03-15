export function hexToRgbTuple(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return "94 234 212";
  }
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `${red} ${green} ${blue}`;
}
