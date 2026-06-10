/**
 * AddTransactionScreen — "Nova transação" flow: Segmented (despesa/receita),
 * numeric keypad, category ChipRow, BankRow, details, save + success state.
 * Ported from the prototype `add.jsx`. Presented as a modal route.
 *
 * The amount is modeled in integer cents (like the prototype) so the keypad is
 * trivial and rounding-safe; it is divided by 100 only for display & on save.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Press, Txt } from '../../components';
import { useCatalog } from '../../context/CatalogContext';
import { useCreateTransaction } from '../../services/hooks';
import { TransactionTypeEnum, type Bank, type Category } from '../../services/types';
import { brl, brlParts } from '../../utils/format';
import { colors, tileShadow, withAlpha } from '../../theme/tokens';

type TxType = 'despesa' | 'receita';

export function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createTx = useCreateTransaction();
  const { expenseCats, incomeCats, banks } = useCatalog();

  const [type, setType] = useState<TxType>('despesa');
  const [cents, setCents] = useState(0);
  const [cat, setCat] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [saved, setSaved] = useState(false);
  const amountRef = useRef<TextInput>(null);

  // Effective bank: the user's pick, else the first catalog bank (no state sync).
  const bank = selectedBank ?? banks[0]?.id ?? null;
  const setBank = setSelectedBank;

  const income = type === 'receita';
  const cats = income ? incomeCats : expenseCats;
  const accent = income ? colors.greenInk : colors.orange;
  const valid = cents > 0 && !!cat && !!bank;

  const close = () => router.back();

  // Amount is entered with the device's native numeric keyboard. We keep the
  // integer-cents model: strip non-digits from the input and reinterpret the
  // whole digit string as cents, so "1250" → R$ 12,50 and backspace works.
  const handleAmountChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 9);
    setCents(digits ? parseInt(digits, 10) : 0);
  };

  const switchType = (t: TxType) => {
    setType(t);
    setCat(null);
  };

  const save = () => {
    if (!valid || !cat || !bank) return;
    setSaved(true);
    createTx.mutate({
      type: income ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
      value: cents / 100,
      categoryId: cat,
      bankId: bank,
      description: desc.trim() || undefined,
    });
    setTimeout(close, 1150);
  };

  const { int, dec } = brlParts(cents / 100);
  const amountColor = cents ? accent : colors.muted;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* header */}
      <View style={styles.header}>
        <Press accessibilityLabel="Fechar" onPress={close} style={[styles.headerBtn, tileShadow]}>
          <Icon name="close" size={20} stroke={colors.ink} sw={2.1} />
        </Press>
        <Txt style={styles.headerTitle}>Nova transação</Txt>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
          <Segmented type={type} setType={switchType} />
        </View>

        {/* amount — a real numeric input (native keyboard), shown as the value */}
        <View style={styles.amountBlock}>
          <Txt style={styles.amountLabel}>{income ? 'VALOR RECEBIDO' : 'VALOR GASTO'}</Txt>
          <View style={styles.amountRow}>
            <Txt style={[styles.amountCurrency, { color: amountColor }]}>R$</Txt>
            <TextInput
              ref={amountRef}
              value={`${int},${dec}`}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              inputMode="numeric"
              autoFocus
              accessibilityLabel="Valor"
              selectionColor={accent}
              style={[styles.amountValue, { color: amountColor }]}
            />
          </View>
          <Txt style={styles.amountHint}>Digite o valor — os centavos entram sozinhos</Txt>
        </View>

        {/* category */}
        <View style={styles.fieldLabelWrap}>
          <Txt style={styles.fieldLabel}>Categoria</Txt>
        </View>
        <ChipRow items={cats} selected={cat} onSelect={setCat} />

        {/* bank */}
        <View style={[styles.fieldLabelWrap, { paddingTop: 14 }]}>
          <Txt style={styles.fieldLabel}>Conta / Banco</Txt>
        </View>
        <BankRow banks={banks} selected={bank} onSelect={setBank} />

        {/* details */}
        <View style={styles.detailsBlock}>
          <View style={[styles.detailRow, tileShadow]}>
            <Icon name="calendar" size={20} stroke={colors.ink2} sw={1.8} />
            <Txt style={styles.detailText}>{todayLabel()}</Txt>
            <Icon name="chevron-right" size={18} stroke={colors.muted} sw={2} />
          </View>
          <View style={[styles.detailRow, tileShadow]}>
            <Icon name="pencil" size={20} stroke={colors.ink2} sw={1.8} />
            <TextInput
              value={desc}
              onChangeText={setDesc}
              placeholder="Adicionar descrição"
              placeholderTextColor={colors.muted}
              style={styles.detailInput}
            />
          </View>
        </View>
      </ScrollView>

      {/* save */}
      <View style={[styles.saveWrap, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
        <Press
          accessibilityLabel={income ? 'Adicionar receita' : 'Adicionar despesa'}
          disabled={!valid}
          onPress={save}
          style={[
            styles.saveBtn,
            {
              backgroundColor: valid ? (income ? colors.green : colors.ink) : colors.line,
            },
            valid && tileShadow,
          ]}
        >
          <Txt style={styles.saveText}>{income ? 'Adicionar receita' : 'Adicionar despesa'}</Txt>
        </Press>
      </View>

      {/* success overlay */}
      {saved && (
        <View style={styles.successOverlay}>
          <View style={styles.successInner}>
            <View style={[styles.successRing, { backgroundColor: income ? colors.green : colors.ink }]}>
              <Icon name="check" size={42} stroke={colors.white} sw={2.6} />
            </View>
            <Txt style={styles.successTitle}>
              {income ? 'Receita adicionada!' : 'Despesa registrada!'}
            </Txt>
            <Txt style={styles.successSub}>{brl(cents / 100)}</Txt>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const MES_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "Hoje, 10 jun 2026" for the (currently fixed-to-today) date row. */
function todayLabel(now: Date = new Date()): string {
  return `Hoje, ${now.getDate()} ${MES_ABBR[now.getMonth()]} ${now.getFullYear()}`;
}

function Segmented({ type, setType }: { type: TxType; setType: (t: TxType) => void }) {
  const opts: { id: TxType; label: string; color: string }[] = [
    { id: 'despesa', label: 'Despesa', color: colors.orange },
    { id: 'receita', label: 'Receita', color: colors.greenInk },
  ];
  return (
    <View style={styles.seg}>
      {opts.map((o) => {
        const active = type === o.id;
        return (
          <Press
            key={o.id}
            accessibilityLabel={o.label}
            accessibilityState={{ selected: active }}
            onPress={() => setType(o.id)}
            style={[styles.segItem, active && [styles.segItemActive, tileShadow]]}
          >
            <Txt style={[styles.segText, { color: active ? o.color : colors.ink2 }]}>{o.label}</Txt>
          </Press>
        );
      })}
    </View>
  );
}

function ChipRow({
  items,
  selected,
  onSelect,
}: {
  items: Category[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipRow}
    >
      {items.map((c) => {
        const active = selected === c.id;
        return (
          <Press
            key={c.id}
            accessibilityLabel={c.label}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(c.id)}
            style={styles.chip}
          >
            <View
              style={[
                styles.chipIcon,
                {
                  backgroundColor: active ? c.color : withAlpha(c.color, '1A'),
                  transform: active ? [{ translateY: -1 }] : undefined,
                },
                active && {
                  shadowColor: c.color,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.33,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              <Icon name={c.icon} size={24} stroke={active ? colors.white : c.color} sw={1.9} />
            </View>
            <Txt
              style={[
                styles.chipLabel,
                { fontWeight: active ? '800' : '600', color: active ? colors.ink : colors.ink2 },
              ]}
            >
              {c.label}
            </Txt>
          </Press>
        );
      })}
    </ScrollView>
  );
}

function BankRow({
  banks,
  selected,
  onSelect,
}: {
  banks: Bank[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.bankRowContent}
    >
      {banks.map((b) => {
        const active = selected === b.id;
        return (
          <Press
            key={b.id}
            accessibilityLabel={b.label}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(b.id)}
            style={[styles.bankChip, { borderColor: active ? colors.ink : colors.line }]}
          >
            <View style={[styles.bankTile, { backgroundColor: b.color }]}>
              <Txt style={[styles.bankShort, { color: b.ink ?? colors.white }]}>{b.short}</Txt>
            </View>
            <Txt style={styles.bankLabel}>{b.label}</Txt>
          </Press>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },

  seg: { flexDirection: 'row', backgroundColor: colors.segBg, borderRadius: 14, padding: 4, gap: 4 },
  segItem: { flex: 1, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segItemActive: { backgroundColor: colors.card },
  segText: { fontWeight: '800', fontSize: 15 },

  amountBlock: { alignItems: 'center', paddingTop: 22, paddingBottom: 14, paddingHorizontal: 16 },
  amountLabel: { fontSize: 13, fontWeight: '700', color: colors.ink2, letterSpacing: 0.3 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  amountCurrency: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  // TextInput needs an explicit family (Txt's weight→family mapping doesn't apply
  // to raw inputs). 48px ExtraBold matches the prototype's amount field.
  amountValue: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: 'PlusJakarta_800ExtraBold',
    letterSpacing: -1.6,
    padding: 0,
    minWidth: 60,
    textAlign: 'center',
  },
  amountHint: { fontSize: 12.5, fontWeight: '600', color: colors.muted, marginTop: 6 },

  fieldLabelWrap: { paddingHorizontal: 16 },
  fieldLabel: { fontSize: 13.5, fontWeight: '800', color: colors.ink, marginBottom: 10 },

  chipScroll: { marginHorizontal: -16 },
  chipRow: { gap: 10, paddingHorizontal: 16, paddingVertical: 2, paddingBottom: 4 },
  chip: { width: 68, alignItems: 'center', gap: 7 },
  chipIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 11.5, textAlign: 'center', lineHeight: 13 },

  bankRowContent: { gap: 9, paddingHorizontal: 16, paddingVertical: 2, paddingBottom: 4 },
  bankChip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 8, paddingRight: 14, borderRadius: 13, backgroundColor: colors.card, borderWidth: 2 },
  bankTile: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  bankShort: { fontSize: 12.5, fontWeight: '800' },
  bankLabel: { fontSize: 13.5, fontWeight: '700', color: colors.ink },

  detailsBlock: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14 },
  detailText: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.ink },
  detailInput: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.ink, padding: 0, fontFamily: 'PlusJakarta_600SemiBold' },

  saveWrap: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: colors.bg },
  saveBtn: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 16.5, fontWeight: '800', color: colors.white },

  successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  successInner: { alignItems: 'center' },
  successRing: { width: 84, height: 84, borderRadius: 999, alignItems: 'center', justifyContent: 'center', ...tileShadow },
  successTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 18 },
  successSub: { fontSize: 14, color: colors.ink2, marginTop: 4 },
});
