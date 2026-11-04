import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { Text } from './Text';

type Props = {
  visivel: boolean;
  titulo: string;
  mensagem?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function ConfirmDialog({
  visivel,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onCancelar}
    >
      <Pressable style={styles.fundo} onPress={onCancelar}>
        <Pressable style={styles.caixa} onPress={() => {}}>
          <View style={styles.tituloLinha}>
            <View style={styles.barra} />
            <Text style={styles.titulo}>{titulo}</Text>
          </View>

          {mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}

          <View style={styles.botoes}>
            <Pressable
              onPress={onCancelar}
              style={({ pressed }) => [
                styles.botao,
                styles.botaoCancelar,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.textoCancelar}>{textoCancelar}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirmar}
              style={({ pressed }) => [
                styles.botao,
                styles.botaoConfirmar,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.textoConfirmar}>{textoConfirmar}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 32,
  },
  caixa: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  tituloLinha: { flexDirection: 'row', gap: 8 },
  barra: { width: 4, borderRadius: 2, backgroundColor: colors.primary },
  titulo: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '700' },
  mensagem: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  botoes: { flexDirection: 'row', gap: 10, marginTop: 4 },
  botao: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoCancelar: { borderWidth: 1, borderColor: colors.border },
  botaoConfirmar: { backgroundColor: colors.primary },
  textoCancelar: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  textoConfirmar: { color: colors.text, fontSize: 15, fontWeight: '700' },
});