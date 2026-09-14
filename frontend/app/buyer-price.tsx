import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { formatRupiah } from "@/src/lib/format";
import { fonts, makeStyles } from "@/src/theme";

export default function BuyerPriceScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { price } = useLocalSearchParams<{ price?: string }>();
  const value = Number(price ?? 0);

  return (
    <Pressable
      testID="buyer-price-screen"
      style={styles.root}
      onPress={() => router.back()}
    >
      <Text testID="buyer-price-value" style={styles.price} adjustsFontSizeToFit numberOfLines={1}>
        {formatRupiah(value)}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  price: {
    fontFamily: fonts.display,
    fontSize: 80,
    color: colors.brandPrimary,
    textAlign: "center",
  },
}));
