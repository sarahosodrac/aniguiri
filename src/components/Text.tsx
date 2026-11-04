import { Text as RNText, StyleSheet, TextProps } from 'react-native';
import { fonts } from '../theme';

// Converte o fontWeight do estilo no arquivo de fonte correspondente
const PESOS: Record<string, string> = {
  normal: fonts.regular,
  '100': fonts.regular,
  '200': fonts.regular,
  '300': fonts.regular,
  '400': fonts.regular,
  '500': fonts.medium,
  '600': fonts.semibold,
  '700': fonts.bold,
  bold: fonts.bold,
  '800': fonts.extrabold,
  '900': fonts.extrabold,
};

export function Text({ style, ...props }: TextProps) {
  const estilo = StyleSheet.flatten(style) ?? {};
  const familia =
    estilo.fontFamily ?? PESOS[String(estilo.fontWeight ?? '400')] ?? fonts.regular;

  return (
    <RNText
      {...props}
      style={[style, { fontFamily: familia, fontWeight: 'normal' }]}
    />
  );
}