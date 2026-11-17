// 円の目安金額は、0以上の安全な整数として扱う。
export function isEstimatedPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function parseEstimatedPrice(input: string): number | undefined {
  const value = input.trim().replace(/[０-９]/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) - 0xfee0)
  );
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value)) return undefined;
  const price = Number(value.replace(/,/g, ''));
  return isEstimatedPrice(price) ? price : undefined;
}

export const itemIcons = ['🥛', '🧴', '🍚', '🍞', '🥚', '🍵', '🥫', '🧻', '🧼', '🧹', '🧺', '📦'] as const;
