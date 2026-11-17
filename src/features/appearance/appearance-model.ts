export type TextSize = 'small' | 'standard' | 'large';
export type DisplaySize = 'compact' | 'standard' | 'roomy';

export const APPEARANCE_STORAGE_KEY = '@kaimono-app/appearance-settings-v1';
export const textScales: Record<TextSize, number> = { small: 0.9, standard: 1, large: 1.2 };
export const displayScales: Record<DisplaySize, number> = { compact: 0.85, standard: 1, roomy: 1.2 };
export const textSizeChoices: { value: TextSize; label: string }[] = [
  { value: 'small', label: '小' }, { value: 'standard', label: '標準' }, { value: 'large', label: '大' },
];
export const displaySizeChoices: { value: DisplaySize; label: string }[] = [
  { value: 'compact', label: 'コンパクト' }, { value: 'standard', label: '標準' }, { value: 'roomy', label: 'ゆったり' },
];
export type AppearanceSettings = { textSize: TextSize; displaySize: DisplaySize; inventoryColumns: 1 | 2 };
export const defaultAppearance: AppearanceSettings = { textSize: 'standard', displaySize: 'standard', inventoryColumns: 1 };

export function readAppearance(value: unknown): AppearanceSettings {
  const saved = value && typeof value === 'object' ? value as Partial<AppearanceSettings> : {};
  return {
    inventoryColumns: saved.inventoryColumns === 2 ? 2 : 1,
    textSize: saved.textSize === 'small' || saved.textSize === 'large' ? saved.textSize : 'standard',
    displaySize: saved.displaySize === 'compact' || saved.displaySize === 'roomy' ? saved.displaySize : 'standard',
  };
}

const textProperties = new Set(['fontSize', 'lineHeight', 'letterSpacing']);
const layoutProperties = new Set([
  'gap', 'rowGap', 'columnGap', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
]);

// 文字と画面の余白・大きさは独立した倍率で計算する。色・flex・割合指定は保つ。
export function scaleAppStyles<T extends Record<string, object>>(base: T, textScale: number, displayScale = 1): T {
  return Object.fromEntries(Object.entries(base).map(([name, style]) => {
    const scaled: Record<string, unknown> = Object.fromEntries(Object.entries(style).map(([key, value]) => {
      if (typeof value !== 'number') return [key, value];
      if (textProperties.has(key)) return [key, value * textScale];
      if (layoutProperties.has(key) || key.startsWith('padding') || key.startsWith('margin')) return [key, value * displayScale];
      return [key, value];
    }));
    // コンパクトでも押す場所は小さくしすぎない。
    if (/(Button|Chip|Input)$/.test(name) || name === 'choice' || name === 'option' || name === 'displayChoice') {
      scaled.minHeight = Math.max(44, typeof scaled.minHeight === 'number' ? scaled.minHeight : 0);
      for (const key of ['height', 'width', 'minWidth']) {
        if (typeof scaled[key] === 'number') scaled[key] = Math.max(44, scaled[key]);
      }
    }
    return [name, scaled];
  })) as T;
}
