import { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStyles } from '@/features/appearance/appearance-context';

import { useInventory, type ItemCategory } from './inventory-context';
import { ModeSettingsButton } from './mode-settings-button';
import { categoryColors } from './category-colors';
import { isEstimatedPrice } from './item-fields';
import { matchesItemName } from './shopping-search';

const categoryOrder: ItemCategory[] = ['食品', '飲み物', '日用品'];

export function ShoppingScreen() {
  const styles = useAppStyles(baseStyles);
  const { items, isReady, mode, removeItem, toggleStock } = useInventory();
  const isAdvanced = mode === 'advanced';
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;
  const missingItems = items.filter((item) => !item.inStock && categoryOrder.includes(item.category) && matchesItemName(item.name, searchQuery));
  const estimatedTotal = missingItems.reduce(
    (total, item) => total + (isEstimatedPrice(item.estimatedPrice) ? item.estimatedPrice : 0),
    0
  );
  const unpricedCount = missingItems.filter((item) => !isEstimatedPrice(item.estimatedPrice)).length;

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
            <Text style={styles.eyebrow}>お買い物のときに</Text>
            <Text style={styles.title}>買うものリスト</Text>
          </View>
          <ModeSettingsButton />
        </View>
        <Text style={styles.subtitle}>在庫がない品物をカテゴリーごとに表示します。</Text>

        <View style={styles.searchRow}>
          <TextInput value={searchQuery} onChangeText={setSearchQuery}
            accessibilityLabel="買うものを品物名で検索" placeholder="品物名で検索"
            placeholderTextColor="#879188" autoCorrect={false} autoCapitalize="none"
            returnKeyType="search" onSubmitEditing={() => Keyboard.dismiss()}
            style={styles.searchInput} />
          {searchQuery.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="検索をクリア"
              onPress={() => setSearchQuery('')}
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
              <Text style={styles.clearButtonText}>クリア</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>🛒</Text>
          <View style={styles.summaryText}>
            <Text style={styles.summaryCount}>{missingItems.length} 点</Text>
            <Text style={styles.summaryCaption}>
              {isSearching ? '検索に合う買うものを表示しています' : missingItems.length === 0 ? '今は買うものがありません' : '買い物が済んだら在庫を更新できます'}
            </Text>
            {isAdvanced && (
              <View style={styles.priceSummary}>
                <Text style={styles.priceTotal}>目安の合計：{estimatedTotal.toLocaleString('ja-JP')}円</Text>
                <Text style={styles.priceUnregistered}>金額未登録：{unpricedCount}点</Text>
              </View>
            )}
          </View>
        </View>

        {missingItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>{isSearching ? '該当する品物が見つかりません' : '買うものはありません'}</Text>
            <Text style={styles.emptyCaption}>{isSearching ? '別の品物名で検索するか、「クリア」で一覧に戻れます。' : '在庫一覧で品物を「買う」にすると、ここに表示されます。'}</Text>
          </View>
        ) : (
          categoryOrder.map((category) => {
            const categoryItems = missingItems.filter((item) => item.category === category);
            if (categoryItems.length === 0) return null;
            const colors = categoryColors[category];

            return (
              <View key={category} style={styles.categorySection}>
                <View
                  style={[
                    styles.categoryHeading,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
                  <Text style={[styles.categoryCount, { color: colors.text }]}>{categoryItems.length} 点</Text>
                </View>
                <View style={styles.itemList}>
                  {categoryItems.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemText}>
                        <View style={styles.itemNameRow}>
                          {item.icon ? <Text style={styles.itemIcon}>{item.icon}</Text> : null}
                          <Text style={styles.itemName}>{item.name}</Text>
                        </View>
                        {isAdvanced && <Text style={styles.frequency}>{item.frequency}</Text>}
                        {isAdvanced && item.estimatedPrice !== undefined && (
                          <Text style={styles.estimatedPrice}>目安：{item.estimatedPrice.toLocaleString('ja-JP')}円</Text>
                        )}
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          isAdvanced && item.frequency === '一度だけ'
                            ? `${item.name}を買って一覧から削除`
                            : `${item.name}を買ったので在庫ありにする`
                        }
                        onPress={() =>
                          isAdvanced && item.frequency === '一度だけ'
                            ? removeItem(item.id)
                            : toggleStock(item.id)
                        }
                        style={({ pressed }) => [
                          styles.doneButton,
                          isAdvanced && item.frequency === '一度だけ' && styles.removeButton,
                          pressed && styles.pressed,
                        ]}>
                        <Text
                          style={[
                            styles.doneButtonText,
                            isAdvanced && item.frequency === '一度だけ' && styles.removeButtonText,
                          ]}>
                          {isAdvanced && item.frequency === '一度だけ' ? '買って削除' : '買った'}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F7F2' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#5F6C61', fontSize: 14 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 14 },
  header: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#6A806E', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  title: { color: '#1E3427', fontSize: 28, fontWeight: '800', marginTop: 0 },
  subtitle: { color: '#748076', fontSize: 13, marginTop: 0 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: '#DDE3D9', backgroundColor: '#FFFFFF', color: '#27382B', fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  clearButton: { minHeight: 44, justifyContent: 'center', borderRadius: 12, padding: 10, backgroundColor: '#E7F0E7' },
  clearButtonText: { color: '#315B40', fontSize: 12, fontWeight: '700' },
  summaryCard: { backgroundColor: '#315B40', borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  summaryEmoji: { fontSize: 30 },
  summaryText: { flex: 1, gap: 2 },
  summaryCount: { color: '#FFFFFF', fontSize: 23, fontWeight: '800' },
  summaryCaption: { color: '#DCE9DC', fontSize: 12 },
  priceSummary: { marginTop: 8, gap: 2 },
  priceTotal: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  priceUnregistered: { color: '#DCE9DC', fontSize: 12 },
  categorySection: { gap: 8, marginTop: 4 },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
  categoryTitle: { color: '#24392B', fontSize: 17, fontWeight: '800' },
  categoryCount: { color: '#879188', fontSize: 12 },
  itemList: { gap: 8 },
  itemCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECEFE8', borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemText: { flex: 1, gap: 4 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemIcon: { fontSize: 21 },
  itemName: { color: '#27382B', fontSize: 16, fontWeight: '800', flexShrink: 1 },
  frequency: { color: '#7B7662', fontSize: 11 },
  estimatedPrice: { color: '#315B40', fontSize: 12, fontWeight: '700' },
  doneButton: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#EAF2EA' },
  doneButtonText: { color: '#3B7048', fontSize: 12, fontWeight: '800' },
  removeButton: { backgroundColor: '#FFF0E9' },
  removeButtonText: { color: '#B65B36' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, alignItems: 'center', gap: 8, marginTop: 6 },
  emptyEmoji: { fontSize: 30 },
  emptyTitle: { color: '#344638', fontSize: 16, fontWeight: '800' },
  emptyCaption: { color: '#879188', fontSize: 12, textAlign: 'center', lineHeight: 19 },
  pressed: { opacity: 0.78 },
});
