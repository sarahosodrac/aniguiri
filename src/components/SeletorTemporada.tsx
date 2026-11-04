import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { nomeTemporada, Temporada } from '../utils/format';
import { Text } from './Text';

type Props = {
  valor: Temporada;
  opcoes: Temporada[];
  onChange: (t: Temporada) => void;
};

function igual(a: Temporada, b: Temporada) {
  return a.season === b.season && a.ano === b.ano;
}

export function SeletorTemporada({ valor, opcoes, onChange }: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        style={({ pressed }) => [styles.botao, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.botaoTexto}>
          {nomeTemporada(valor.season, valor.ano)}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.text} />
      </Pressable>

      <Modal
        visible={aberto}
        transparent
        animationType="slide"
        onRequestClose={() => setAberto(false)}
      >
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <Pressable style={styles.folha} onPress={() => {}}>
            <Text style={styles.titulo}>Temporada</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {opcoes.map((t) => {
                const selecionada = igual(t, valor);
                return (
                  <Pressable
                    key={`${t.season}-${t.ano}`}
                    onPress={() => {
                      onChange(t);
                      setAberto(false);
                    }}
                    style={[styles.opcao, selecionada && styles.opcaoAtiva]}
                  >
                    <Text style={styles.opcaoTexto}>
                      {nomeTemporada(t.season, t.ano)}
                    </Text>
                    {selecionada && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  botaoTexto: { color: colors.text, fontSize: 14, fontWeight: '600' },
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  folha: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 8,
  },
  titulo: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  opcao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  opcaoAtiva: { borderColor: colors.primary },
  opcaoTexto: { color: colors.text, fontSize: 16 },
});