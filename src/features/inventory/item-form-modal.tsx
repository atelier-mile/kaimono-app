import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStyles } from '@/features/appearance/appearance-context';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { AppMode, InventoryItem, ItemCategory, ShoppingFrequency } from './inventory-context';
import { categoryColors } from './category-colors';
import { itemIcons as iconChoices, parseEstimatedPrice } from './item-fields';

const categories: ItemCategory[] = ['食品', '飲み物', '日用品'];
const frequencies: ShoppingFrequency[] = ['いつも買う', 'たまに買う', '一度だけ'];


type ItemFormValues = {
  name: string;
  category: ItemCategory;
  frequency: ShoppingFrequency;
  estimatedPrice?: number;
  icon?: string;
};

type ItemFormModalProps = {
  visible: boolean;
  item: InventoryItem | null;
  mode: AppMode;
  onClose: () => void;
  onSave: (values: ItemFormValues) => void;
};

export function ItemFormModal({ visible, item, mode, onClose, onSave }: ItemFormModalProps) {
  const styles = useAppStyles(baseStyles);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<ItemCategory>(item?.category ?? '食品');
  const [frequency, setFrequency] = useState<ShoppingFrequency>(item?.frequency ?? 'いつも買う');
  const [estimatedPrice, setEstimatedPrice] = useState(
    item?.estimatedPrice === undefined ? '' : String(item.estimatedPrice)
  );
  const [icon, setIcon] = useState(item?.icon ?? '');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');

  const trimmedName = name.trim();

  function handleSave() {
    if (!trimmedName) {
      setNameError('品物の名前を入力してください。');
      return;
    }

    const parsedPrice = parseEstimatedPrice(estimatedPrice);
    if (mode === 'advanced' && estimatedPrice.trim() !== '' && parsedPrice === undefined) {
      setPriceError('目安の金額は0以上の整数で入力してください。空欄でも保存できます。');
      return;
    }

    onSave({
      name: item && name === item.name ? item.name : trimmedName,
      category,
      frequency: mode === 'advanced' ? frequency : item?.frequency ?? 'いつも買う',
      estimatedPrice: mode === 'advanced' ? parsedPrice : item?.estimatedPrice,
      icon: icon || undefined,
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.modalCard, { paddingBottom: Math.max(styles.modalCard.paddingBottom, insets.bottom + 16) }]}>
            <View style={styles.headingRow}>
              <View>
                <Text style={styles.eyebrow}>{item ? '品物の内容を編集' : '新しい品物を登録'}</Text>
                <Text style={styles.title}>{item ? '品物を変更' : '品物を追加'}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="入力をやめる"
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>品物の名前</Text>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (value.trim()) setNameError('');
              }}
              maxLength={40}
              placeholder="例：牛乳"
              placeholderTextColor="#A0AAA1"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              style={styles.nameInput}
              accessibilityLabel="品物の名前"
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <Text style={styles.fieldLabel}>カテゴリー</Text>
            <View style={styles.choiceRow}>
              {categories.map((choice) => {
                const selected = category === choice;
                const colors = categoryColors[choice];
                return (
                  <Pressable
                    key={choice}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setCategory(choice)}
                    style={({ pressed }) => [
                      styles.choiceButton,
                      {
                        backgroundColor: selected ? colors.accent : colors.background,
                        borderColor: selected ? colors.accent : colors.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.choiceText, { color: selected ? '#FFFFFF' : colors.text }]}>
                      {choice}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {mode === 'simple' && (
              <>
                <Text style={styles.fieldLabel}>アイコン（任意）</Text>
                <View style={styles.iconChoiceGrid}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="アイコンなし"
                    accessibilityState={{ selected: icon === '' }}
                    onPress={() => setIcon('')}
                    style={({ pressed }) => [
                      styles.iconChoiceButton,
                      icon === '' && styles.iconChoiceButtonSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.noIconText}>なし</Text>
                  </Pressable>
                  {iconChoices.map((choice) => (
                    <Pressable
                      key={choice}
                      accessibilityRole="button"
                      accessibilityLabel={`${choice}を選択`}
                      accessibilityState={{ selected: icon === choice }}
                      onPress={() => setIcon(choice)}
                      style={({ pressed }) => [
                        styles.iconChoiceButton,
                        icon === choice && styles.iconChoiceButtonSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={styles.iconChoiceText}>{choice}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.helpText}>アイコンは後から変更・解除できます。</Text>
              </>
            )}

            {mode === 'advanced' && (
              <>
                <Text style={styles.fieldLabel}>アイコン</Text>
                <View style={styles.iconChoiceGrid}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="アイコンなし"
                    accessibilityState={{ selected: icon === '' }}
                    onPress={() => setIcon('')}
                    style={({ pressed }) => [
                      styles.iconChoiceButton,
                      icon === '' && styles.iconChoiceButtonSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.noIconText}>なし</Text>
                  </Pressable>
                  {iconChoices.map((choice) => (
                    <Pressable
                      key={choice}
                      accessibilityRole="button"
                      accessibilityLabel={`${choice}を選択`}
                      accessibilityState={{ selected: icon === choice }}
                      onPress={() => setIcon(choice)}
                      style={({ pressed }) => [
                        styles.iconChoiceButton,
                        icon === choice && styles.iconChoiceButtonSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={styles.iconChoiceText}>{choice}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.helpText}>アイコンは後から変更・解除できます。</Text>
                <Text style={styles.fieldLabel}>買う頻度</Text>
                <View style={styles.choiceRow}>
                  {frequencies.map((choice) => {
                    const selected = frequency === choice;
                    return (
                      <Pressable
                        key={choice}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setFrequency(choice)}
                        style={({ pressed }) => [
                          styles.choiceButton,
                          selected && styles.choiceButtonSelected,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                          {choice}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.fieldLabel}>目安の金額（円）</Text>
                <TextInput
                  value={estimatedPrice}
                  onChangeText={(value) => {
                    setEstimatedPrice(value);
                    setPriceError('');
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholder="未入力でも登録できます"
                  placeholderTextColor="#A0AAA1"
                  style={styles.nameInput}
                  accessibilityLabel="目安の金額（円）"
                />
                {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
                <Text style={styles.helpText}>任意入力です。実際の購入価格ではなく、買い物の目安です。</Text>
              </>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.saveButtonText}>{item ? '変更を保存' : '品物を登録'}</Text>
            </Pressable>
            <Text style={styles.helpText}>
              {frequency === '一度だけ'
                ? '買い物リストで「買って削除」を押すと、一覧から削除されます。'
                : '名前は40文字まで入力できます。'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const baseStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 34, 25, 0.42)' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#F7F7F2', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28, gap: 12,
  },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  eyebrow: { color: '#6A806E', fontSize: 12, fontWeight: '700' },
  title: { color: '#1E3427', fontSize: 23, fontWeight: '800', marginTop: 3 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#E8ECE5' },
  closeButtonText: { color: '#405544', fontSize: 25, lineHeight: 28 },
  fieldLabel: { color: '#344638', fontSize: 13, fontWeight: '800', marginTop: 4 },
  nameInput: { backgroundColor: '#FFFFFF', borderColor: '#DDE3D9', borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, color: '#27382B', fontSize: 16 },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choiceButton: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderColor: '#DDE3D9', borderWidth: 1, borderRadius: 13, paddingVertical: 11, paddingHorizontal: 6 },
  choiceButtonSelected: { backgroundColor: '#315B40', borderColor: '#315B40' },
  choiceText: { color: '#5F6C61', fontSize: 12, fontWeight: '700' },
  choiceTextSelected: { color: '#FFFFFF' },
  iconChoiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChoiceButton: { width: 52, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: '#DDE3D9', backgroundColor: '#FFFFFF' },
  iconChoiceButtonSelected: { backgroundColor: '#E7F0E7', borderColor: '#315B40' },
  iconChoiceText: { fontSize: 25 },
  noIconText: { color: '#5F6C61', fontSize: 12, fontWeight: '700' },
  saveButton: { alignItems: 'center', backgroundColor: '#315B40', borderRadius: 15, paddingVertical: 14, marginTop: 8 },
  saveButtonDisabled: { backgroundColor: '#AAB8AC' },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  helpText: { color: '#879188', fontSize: 11, textAlign: 'center' },
  errorText: { color: '#B64D37', fontSize: 12, fontWeight: '700', marginTop: -5 },
  pressed: { opacity: 0.78 },
});
