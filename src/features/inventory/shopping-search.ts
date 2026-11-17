function normalizeName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/[ァ-ヶ]/g,
    (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

// 品物は変更せず、名前の部分一致だけを判定する。
export function matchesItemName(name: string, query: string): boolean {
  const normalizedName = normalizeName(name);
  return normalizeName(query).trim().split(/\s+/).every((word) => normalizedName.includes(word));
}
