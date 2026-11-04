import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Marca } from './Marca';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  marca?: boolean;
  children?: ReactNode;
};

export function Screen({ title, subtitle, marca = true, children }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {marca && <Marca />}
      <View style={[styles.header, marca && { marginTop: 8 }]}>
        <View style={styles.bar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  header: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 16 },
  bar: { width: 4, borderRadius: 2, backgroundColor: colors.primary },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 2 },
});