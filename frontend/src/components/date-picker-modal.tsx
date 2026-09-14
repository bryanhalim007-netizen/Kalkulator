import { CaretLeft, CaretRight } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { fonts, makeStyles, useTheme } from "@/src/theme";

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DatePickerModal({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [view, setView] = useState({
    year: value.getFullYear(),
    month: value.getMonth(),
  });

  useEffect(() => {
    if (visible) setView({ year: value.getFullYear(), month: value.getMonth() });
  }, [visible, value]);

  const today = new Date();
  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(
    "id-ID",
    { month: "long", year: "numeric" },
  );

  const shift = (delta: number) => {
    const m = view.month + delta;
    const year = view.year + Math.floor(m / 12);
    const month = ((m % 12) + 12) % 12;
    setView({ year, month });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} testID="datepicker-overlay">
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <Pressable
              testID="datepicker-prev"
              onPress={() => shift(-1)}
              hitSlop={10}
              style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
            >
              <CaretLeft size={20} color={colors.onSurface} weight="bold" />
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              testID="datepicker-next"
              onPress={() => shift(1)}
              hitSlop={10}
              style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
            >
              <CaretRight size={20} color={colors.onSurface} weight="bold" />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (d === null) return <View key={i} style={styles.cell} />;
              const dateObj = new Date(view.year, view.month, d);
              const isSelected = sameDay(dateObj, value);
              const isToday = sameDay(dateObj, today);
              return (
                <Pressable
                  key={i}
                  testID={`datepicker-day-${d}`}
                  onPress={() => {
                    onSelect(dateObj);
                    onClose();
                  }}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isToday && styles.dayToday,
                      isSelected && styles.daySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable
              testID="datepicker-today"
              onPress={() => {
                onSelect(new Date());
                onClose();
              }}
              style={({ pressed }) => [styles.todayBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.todayBtnText}>Hari Ini</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  navBtnPressed: { backgroundColor: colors.brandPrimary },
  monthLabel: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    color: colors.onSurface,
    textTransform: "capitalize",
  },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  dayInner: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: { borderWidth: 1, borderColor: colors.borderStrong },
  daySelected: { backgroundColor: colors.brandPrimary },
  dayText: { fontFamily: fonts.medium, fontSize: 15, color: colors.onSurface },
  dayTextSelected: { color: colors.onBrandPrimary, fontFamily: fonts.semibold },
  footer: { marginTop: 10, alignItems: "center" },
  todayBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
  },
  todayBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.brandPrimary,
  },
}));
