import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppearance, useAppStyles } from '../appearance/appearance-context';
import { displaySizeChoices, textSizeChoices } from '../appearance/appearance-model';
import { useInventory, type AppMode } from './inventory-context';

export function ModeSettingsButton() {
  const styles = useAppStyles(baseStyles);
  const { mode, setMode } = useInventory();
  const { settings, isReady, setTextSize, setDisplaySize, setInventoryColumns } = useAppearance();
  const [visible, setVisible] = useState(false);

  function chooseMode(nextMode: AppMode) {
    setMode(nextMode);
    setVisible(false);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="文字サイズ・画面表示・モードの設定"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}>
        <Text style={styles.openButtonText}>⚙ 設定</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <ScrollView contentContainerStyle={styles.cardContent}>
              <Text style={styles.title}>設定</Text>
              <Text style={styles.sectionTitle}>文字サイズ</Text>
              <View style={styles.choiceRow}>
                {textSizeChoices.map((choice) => (
                  <Pressable key={choice.value}
                    accessibilityRole="button"
                    accessibilityLabel={`文字サイズ：${choice.label}`}
                    accessibilityState={{ selected: settings.textSize === choice.value, disabled: !isReady }}
                    disabled={!isReady}
                    onPress={() => setTextSize(choice.value)}
                    style={({ pressed }) => [styles.choice, settings.textSize === choice.value && styles.selectedOption, pressed && styles.pressed]}>
                    <Text style={[styles.optionTitle, settings.textSize === choice.value && styles.selectedText]}>{choice.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.description}>選んだ文字サイズは、アプリを開き直しても維持されます。</Text>
              <Text style={styles.sectionTitle}>画面全体の表示サイズ</Text>
              <Text style={styles.description}>文字サイズとは別に、画面の余白・ボタン・入力欄の大きさや間隔を調整します。</Text>
              <View style={styles.displayChoiceList}>
                {displaySizeChoices.map((choice) => (
                  <Pressable key={choice.value} accessibilityRole="button"
                    accessibilityLabel={`画面全体の表示サイズ：${choice.label}`}
                    accessibilityState={{ selected: settings.displaySize === choice.value, disabled: !isReady }}
                    disabled={!isReady} onPress={() => setDisplaySize(choice.value)}
                    style={({ pressed }) => [styles.displayChoice, settings.displaySize === choice.value && styles.selectedOption, pressed && styles.pressed]}>
                    <Text style={[styles.optionTitle, settings.displaySize === choice.value && styles.selectedText]}>{choice.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.sectionTitle}>表示列数</Text>
              <Text style={styles.description}>在庫一覧を1列または2列で表示します。選んだ列数は保存されます。</Text>
              <View style={styles.choiceRow}>
                {([1, 2] as const).map((columns) => (
                  <Pressable key={columns} accessibilityRole="button"
                    accessibilityLabel={`在庫一覧の表示列数：${columns}列`}
                    accessibilityState={{ selected: settings.inventoryColumns === columns, disabled: !isReady }}
                    disabled={!isReady} onPress={() => setInventoryColumns(columns)}
                    style={({ pressed }) => [styles.choice, settings.inventoryColumns === columns && styles.selectedOption, pressed && styles.pressed]}>
                    <Text style={[styles.optionTitle, settings.inventoryColumns === columns && styles.selectedText]}>{columns}列</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.sectionTitle}>表示モード</Text>
              <Text style={styles.description}>品物の一覧を保ったまま、使う機能を切り替えられます。</Text>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'simple' }}
                onPress={() => chooseMode('simple')}
                style={({ pressed }) => [styles.option, mode === 'simple' && styles.selectedOption, pressed && styles.pressed]}>
                <Text style={[styles.optionTitle, mode === 'simple' && styles.selectedText]}>シンプルモード</Text>
                <Text style={[styles.optionDescription, mode === 'simple' && styles.selectedText]}>基本の操作だけを表示します</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'advanced' }}
                onPress={() => chooseMode('advanced')}
                style={({ pressed }) => [styles.option, mode === 'advanced' && styles.selectedOption, pressed && styles.pressed]}>
                <Text style={[styles.optionTitle, mode === 'advanced' && styles.selectedText]}>アドバンスモード</Text>
                <Text style={[styles.optionDescription, mode === 'advanced' && styles.selectedText]}>買う頻度や目安の金額も使えます</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setVisible(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <Text style={styles.closeButtonText}>閉じる</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const baseStyles = StyleSheet.create({
  openButton: { minHeight: 44, justifyContent: 'center', borderRadius: 13, backgroundColor: '#E7F0E7', paddingVertical: 10, paddingHorizontal: 12 },
  openButtonText: { color: '#315B40', fontSize: 12, fontWeight: '800' },
  overlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(20, 34, 25, 0.45)' },
  card: { backgroundColor: '#F7F7F2', borderRadius: 22, maxHeight: '90%' },
  cardContent: { padding: 20, gap: 12 },
  title: { color: '#1E3427', fontSize: 22, fontWeight: '800' },
  sectionTitle: { color: '#344638', fontSize: 15, fontWeight: '800', marginTop: 6 },
  description: { color: '#667368', fontSize: 13, lineHeight: 20 },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 13, borderWidth: 1, borderColor: '#DDE3D9', backgroundColor: '#FFFFFF' },
  displayChoiceList: { gap: 8 },
  displayChoice: { minHeight: 44, justifyContent: 'center', borderRadius: 13, padding: 12, borderWidth: 1, borderColor: '#DDE3D9', backgroundColor: '#FFFFFF' },
  option: { borderRadius: 15, borderWidth: 1, borderColor: '#DDE3D9', backgroundColor: '#FFFFFF', padding: 14, gap: 4 },
  selectedOption: { borderColor: '#315B40', backgroundColor: '#315B40' },
  optionTitle: { color: '#27382B', fontSize: 15, fontWeight: '800' },
  optionDescription: { color: '#748076', fontSize: 12 },
  selectedText: { color: '#FFFFFF' },
  closeButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  closeButtonText: { color: '#536357', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
