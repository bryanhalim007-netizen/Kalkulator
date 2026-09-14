import { Pressable, Text, View } from "react-native";

import { fonts, makeStyles } from "@/src/theme";

export type SegmentOption = { value: string; label: string };

export function Segmented({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: SegmentOption[];
  value: string | null;
  onChange: (v: string | null) => void;
  testIDPrefix: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            testID={`${testIDPrefix}-${o.value}`}
            onPress={() => onChange(active ? null : o.value)}
            style={({ pressed }) => [
              styles.seg,
              active && styles.segActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: "row", gap: 10 },
  seg: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  segText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.onSurfaceSecondary,
  },
  segTextActive: { color: colors.onBrandPrimary },
}));
