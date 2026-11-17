import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import {
  APPEARANCE_STORAGE_KEY, defaultAppearance, displayScales, readAppearance, scaleAppStyles, textScales,
  type AppearanceSettings, type DisplaySize, type TextSize,
} from './appearance-model';

const AppearanceContext = createContext<{
  settings: AppearanceSettings;
  isReady: boolean;
  textScale: number;
  displayScale: number;
  setTextSize: (size: TextSize) => void;
  setDisplaySize: (size: DisplaySize) => void;
  setInventoryColumns: (columns: 1 | 2) => void;
} | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultAppearance);
  const [isReady, setIsReady] = useState(false);
  const previous = useRef(JSON.stringify(defaultAppearance));
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(APPEARANCE_STORAGE_KEY).then((saved) => {
      const loaded = readAppearance(saved === null ? null : JSON.parse(saved));
      if (active) {
        previous.current = JSON.stringify(loaded);
        setSettings(loaded);
        setIsReady(true);
      }
    }).catch(() => {
      if (active) Alert.alert('表示設定を読み込めません', '保存済みの設定と品物はそのまま保持しています。アプリを開き直してください。');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const serialized = JSON.stringify(settings);
    if (!isReady || serialized === previous.current) return;
    previous.current = serialized;
    queue.current = queue.current.then(() => AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, serialized)).catch(() => {
      Alert.alert('表示設定を保存できません', '空き容量などを確認し、設定を選び直してください。');
    });
  }, [isReady, settings]);

  return (
    <AppearanceContext.Provider value={{
      settings, isReady, textScale: textScales[settings.textSize], displayScale: displayScales[settings.displaySize],
      setInventoryColumns: (inventoryColumns) => { if (isReady) setSettings((current) => ({ ...current, inventoryColumns })); },
      setTextSize: (textSize) => { if (isReady) setSettings((current) => ({ ...current, textSize })); },
      setDisplaySize: (displaySize) => { if (isReady) setSettings((current) => ({ ...current, displaySize })); },
    }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('表示設定を読み込めませんでした。');
  return value;
}

export function useAppStyles<T extends Record<string, object>>(base: T): T {
  const { textScale, displayScale } = useAppearance();
  return useMemo(() => scaleAppStyles(base, textScale, displayScale), [base, textScale, displayScale]);
}
