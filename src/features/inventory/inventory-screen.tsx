import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance, useAppStyles } from '@/features/appearance/appearance-context';

import { ItemFormModal } from './item-form-modal';
import { ModeSettingsButton } from './mode-settings-button';
import { matchesItemName } from './shopping-search';
import { categoryColors } from './category-colors';
import { useInventory, type ItemCategory, type ShoppingFrequency } from './inventory-context';

const categories: ('すべて' | ItemCategory)[] = ['すべて', '食品', '飲み物', '日用品'];
const frequencies: ('すべて' | ShoppingFrequency)[] = [
  'すべて',
  'いつも買う',
  'たまに買う',
  '一度だけ',
];

export function InventoryScreen() {
  const styles = useAppStyles(baseStyles);
  const { items, isReady, mode, addItem, updateItem, toggleStock } = useInventory();
  const { settings } = useAppearance();
  const twoColumns = settings.inventoryColumns === 2;
  const [searchQuery, setSearchQuery] = useState('');
  const isAdvanced = mode === 'advanced';
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('すべて');
  const [selectedFrequency, setSelectedFrequency] =
    useState<(typeof frequencies)[number]>('すべて');
  const [shoppingOnly, setShoppingOnly] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const missingCount = items.filter((item) => !item.inStock).length;
  const editingItem = items.find((item) => item.id === editingItemId) ?? null;

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesCategory = selectedCategory === 'すべて' || item.category === selectedCategory;
        const matchesFrequency =
          selectedFrequency === 'すべて' || item.frequency === selectedFrequency;
        const matchesStock = !shoppingOnly || !item.inStock;
        return matchesCategory && matchesFrequency && matchesStock && matchesItemName(item.name, searchQuery);
      }),
    [items, selectedCategory, selectedFrequency, shoppingOnly, searchQuery]
  );

  function saveItem(values: { name: string; category: ItemCategory; frequency: ShoppingFrequency; estimatedPrice?: number; icon?: string }) {
    if (editingItem) {
      updateItem(editingItem.id, values);
    } else {
      addItem(values);
      // 追加した品物が、現在の絞り込み条件で隠れないようにする。
      setSelectedCategory('すべて');
      setSelectedFrequency('すべて');
      setShoppingOnly(false);
      setSearchQuery('');
    }
    setIsFormVisible(false);
    setEditingItemId(null);
  }

  if (!isReady) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>品物を読み込んでいます…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>くらしのストック</Text>
            <Text style={styles.title}>おうちの在庫</Text>
          </View>
          <View style={styles.headerActions}>
            <ModeSettingsButton />
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{missingCount}</Text>
              <Text style={styles.countLabel}>買うもの</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryEmoji}>🧺</Text>
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>買い物リスト</Text>
            <Text style={styles.summaryCaption}>
              {missingCount === 0 ? '今は買うものがありません' : `在庫がないものが ${missingCount} 点あります`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shoppingOnly ? 'すべての品物を表示' : '買うものだけを表示'}
            onPress={() => setShoppingOnly((value) => !value)}
            style={({ pressed }) => [styles.summaryButton, pressed && styles.pressed]}>
            <Text style={styles.summaryButtonText}>{shoppingOnly ? 'すべて見る' : '見る'}</Text>
          </Pressable>
        </View>

        <View style={styles.searchArea}>
          <TextInput accessibilityLabel="在庫一覧を品物名で検索"
            placeholder="品物名で検索" placeholderTextColor="#879188"
            value={searchQuery} onChangeText={setSearchQuery}
            autoCapitalize="none" autoCorrect={false} returnKeyType="search"
            style={styles.searchInput} />
          {searchQuery.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="在庫の検索と絞り込みを解除"
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('すべて');
                setSelectedFrequency('すべて');
                setShoppingOnly(false);
              }} style={styles.clearSearchButton}>
              <Text style={styles.clearSearchText}>検索をクリア</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>カテゴリー</Text>
          <Text style={styles.sectionHint}>種類でしぼる</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {categories.map((category) => {
            const selected = selectedCategory === category;
            const colors = categoryColors[category as ItemCategory];
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSelectedCategory(category)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  category !== 'すべて' && {
                    backgroundColor: selected ? colors.accent : colors.background,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                  selected && category === 'すべて' && styles.categoryChipSelected,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.categoryChipText,
                    category !== 'すべて' && { color: selected ? '#FFFFFF' : colors.text },
                    selected && category === 'すべて' && styles.categoryChipTextSelected,
                  ]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isAdvanced && (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>買う頻度</Text>
              <Text style={styles.sectionHint}>いつも／たまに</Text>
            </View>
            <View style={styles.frequencyRow}>
              {frequencies.map((frequency) => {
                const selected = selectedFrequency === frequency;
                return (
                  <Pressable
                    key={frequency}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedFrequency(frequency)}
                    style={({ pressed }) => [
                      styles.frequencyButton,
                      selected && styles.frequencyButtonSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.frequencyText, selected && styles.frequencyTextSelected]}>
                      {frequency}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.listHeading}>
          <View>
            <Text style={styles.sectionTitle}>{shoppingOnly ? '買うもの' : '品物一覧'}</Text>
            <Text style={styles.sectionHint}>{visibleItems.length} 点</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditingItemId(null);
              setIsFormVisible(true);
            }}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonText}>＋ 品物を追加</Text>
          </Pressable>
        </View>

        {visibleItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>{items.length === 0 ? 'まだ品物が登録されていません' : searchQuery.trim() ? '検索に合う品物がありません' : '表示する品物はありません'}</Text>
            <Text style={styles.emptyCaption}>
              {items.length === 0 ? '「＋ 品物を追加」から登録できます' : searchQuery.trim() ? '検索する文字や絞り込み条件を変えてみてください' : isAdvanced ? 'カテゴリーや買う頻度を変えてみてください' : 'カテゴリーを変えてみてください'}
            </Text>
          </View>
        ) : (
          <View style={[styles.itemList, twoColumns && styles.itemGrid]}>
            {visibleItems.map((item) => (
              <View key={item.id} style={[styles.itemCell, twoColumns && styles.itemCellTwo]}>
              <View style={[styles.itemCard, twoColumns && styles.itemCardTwo]}>
                <View style={styles.itemMain}>
                  <View style={styles.itemNameRow}>
                    {item.icon ? <Text style={styles.itemIcon}>{item.icon}</Text> : null}
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <View style={styles.itemTags}>
      <Text style={[styles.categoryTag, {
        backgroundColor: categoryColors[item.category].background,
        borderColor: categoryColors[item.category].border,
        color: categoryColors[item.category].text,
      }]}>{item.category}</Text>
                    {isAdvanced && <Text style={styles.frequencyTag}>{item.frequency}</Text>}
                  </View>
                  {isAdvanced && item.estimatedPrice !== undefined && (
                    <Text style={styles.estimatedPrice}>目安：{item.estimatedPrice.toLocaleString('ja-JP')}円</Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}の名前や分類を変更`}
                  onPress={() => {
                    setEditingItemId(item.id);
                    setIsFormVisible(true);
                  }}
                  style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                  <Text style={styles.editButtonText}>変更</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}の在庫を${item.inStock ? 'なし' : 'あり'}にする`}
                  onPress={() => toggleStock(item.id)}
                  style={({ pressed }) => [
                    styles.stockButton,
                    item.inStock ? styles.stockButtonOn : styles.stockButtonOff,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.stockButtonText, item.inStock ? styles.stockTextOn : styles.stockTextOff]}>
                    {item.inStock ? '✓ あり' : '＋ 買う'}
                  </Text>
                </Pressable>
              </View>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.footerNote}>品物の一覧は、このスマホに自動で保存されます。</Text>
      </ScrollView>
      {isFormVisible && (
        <ItemFormModal
          key={editingItem?.id ?? 'new-item-form'}
          visible
          item={editingItem}
          mode={mode}
          onClose={() => {
            setIsFormVisible(false);
            setEditingItemId(null);
          }}
          onSave={saveItem}
        />
      )}
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F7F2' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#5F6C61', fontSize: 14 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 18 },
  header: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { alignItems: 'flex-end', gap: 8 },
  eyebrow: { color: '#6A806E', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#1E3427', fontSize: 28, fontWeight: '800', marginTop: 4 },
  countBadge: {
    backgroundColor: '#E7F0E7', borderRadius: 18, minWidth: 72, paddingVertical: 9,
    paddingHorizontal: 12, alignItems: 'center',
  },
  countNumber: { color: '#376545', fontSize: 21, fontWeight: '800' },
  countLabel: { color: '#54725B', fontSize: 11, fontWeight: '700', marginTop: 1 },
  summaryCard: {
    backgroundColor: '#315B40', borderRadius: 22, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12,
  },
  summaryIcon: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: '#477250',
    justifyContent: 'center', alignItems: 'center',
  },
  summaryEmoji: { fontSize: 23 },
  summaryText: { flex: 1 },
  summaryTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  summaryCaption: { color: '#DCE9DC', fontSize: 12, marginTop: 4 },
  summaryButton: { backgroundColor: '#FFFFFF', borderRadius: 13, paddingVertical: 9, paddingHorizontal: 13 },
  summaryButtonText: { color: '#315B40', fontSize: 13, fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: -8 },
  sectionTitle: { color: '#24392B', fontSize: 17, fontWeight: '800' },
  sectionHint: { color: '#879188', fontSize: 12 },
  chipRow: { gap: 8, paddingVertical: 4 },
  categoryChip: { borderRadius: 20, borderWidth: 1, borderColor: '#DDE3D9', backgroundColor: '#FFFFFF', paddingVertical: 9, paddingHorizontal: 16 },
  categoryChipSelected: { borderColor: '#315B40', backgroundColor: '#315B40' },
  categoryChipText: { color: '#5F6C61', fontSize: 13, fontWeight: '700' },
  categoryChipTextSelected: { color: '#FFFFFF' },
  frequencyRow: { flexDirection: 'row', gap: 8 },
  frequencyButton: { flex: 1, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#DDE3D9', backgroundColor: '#FFFFFF', paddingVertical: 11, paddingHorizontal: 4 },
  frequencyButtonSelected: { backgroundColor: '#E7F0E7', borderColor: '#BCD0BE' },
  frequencyText: { color: '#6D786E', fontSize: 12, fontWeight: '700' },
  frequencyTextSelected: { color: '#315B40' },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 },
  addButton: { borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: '#315B40', marginBottom: 2 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  searchArea: { gap: 4 },
  searchInput: { minHeight: 48, borderWidth: 1, borderColor: '#DDE3D9', borderRadius: 14, padding: 12, backgroundColor: '#FFFFFF', color: '#27382B', fontSize: 16 },
  clearSearchButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8 },
  clearSearchText: { color: '#315B40', fontSize: 13, fontWeight: '700' },
  itemList: { gap: 9 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginHorizontal: -4 },
  itemCell: { width: '100%' },
  itemCellTwo: { width: '50%', paddingHorizontal: 4, marginBottom: 9 },
  itemCardTwo: { flexDirection: 'column', alignItems: 'stretch', flex: 1 },
  itemCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#ECEFE8',
    padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  itemMain: { flex: 1, minWidth: 0, gap: 7 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemIcon: { fontSize: 21 },
  estimatedPrice: { color: '#315B40', fontSize: 12, fontWeight: '700' },
  itemName: { color: '#27382B', fontSize: 16, fontWeight: '800', flexShrink: 1 },
  itemTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  editButton: { minWidth: 47, alignItems: 'center', borderRadius: 11, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: '#F0F2ED' },
  editButtonText: { color: '#59685B', fontSize: 11, fontWeight: '800' },
  categoryTag: { color: '#58715D', backgroundColor: '#EDF3ED', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '700' },
  frequencyTag: { color: '#7B7662', backgroundColor: '#F4F1E8', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '700' },
  stockButton: { minWidth: 80, alignItems: 'center', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 9 },
  stockButtonOn: { backgroundColor: '#EAF2EA' },
  stockButtonOff: { backgroundColor: '#FFF0E9' },
  stockButtonText: { fontSize: 12, fontWeight: '800' },
  stockTextOn: { color: '#3B7048' },
  stockTextOff: { color: '#B65B36' },
  emptyCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 28, paddingHorizontal: 16, gap: 6 },
  emptyEmoji: { fontSize: 26 },
  emptyTitle: { color: '#344638', fontSize: 15, fontWeight: '800' },
  emptyCaption: { color: '#879188', fontSize: 12, textAlign: 'center' },
  footerNote: { color: '#879188', fontSize: 11, textAlign: 'center', marginTop: 1 },
  pressed: { opacity: 0.78 },
});
