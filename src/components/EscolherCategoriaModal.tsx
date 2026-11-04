import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { AnimeResumo } from '../api/anilist';
import { adicionarNaLista, Categoria, listarCategorias } from '../db/repo';
import { colors } from '../theme';
import { nomeTemporada, Temporada, temporadaAtual } from '../utils/format';
import { Text } from './Text';

type Props = {
  anime: AnimeResumo | null;
  temporada?: Temporada; // padrão: temporada atual
  categoriaAtualId?: number | null; // marca a categoria em que o anime já está
  onClose: () => void;
  onSalvo: (anilistId: number) => void;
};

export function EscolherCategoriaModal({
  anime,
  temporada,
  categoriaAtualId,
  onClose,
  onSalvo,
}: Props) {
  const db = useSQLiteContext();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const alvo = temporada ?? temporadaAtual();

  useEffect(() => {
    if (anime) listarCategorias(db).then(setCategorias);
  }, [anime, db]);

  async function escolher(cat: Categoria) {
    if (!anime) return;
    await adicionarNaLista(db, anime, cat.id, alvo.season, alvo.ano);
    onSalvo(anime.id);
    onClose();
  }

  return (
    <Modal
      visible={anime !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.fundo} onPress={onClose}>
        <Pressable style={styles.folha} onPress={() => {}}>
          <Text style={styles.titulo} numberOfLines={2}>
            {anime?.title.romaji}
          </Text>
          <Text style={styles.sub}>
            {categoriaAtualId ? 'Mover para' : 'Adicionar em'}{' '}
            {nomeTemporada(alvo.season, alvo.ano)}
          </Text>

          {categorias.map((c) => {
            const atual = c.id === categoriaAtualId;
            return (
              <Pressable
                key={c.id}
                onPress={() => escolher(c)}
                style={({ pressed }) => [
                  styles.opcao,
                  atual && styles.opcaoAtual,
                  pressed && styles.opcaoPressionada,
                ]}
              >
                <Text style={styles.opcaoTexto}>{c.nome}</Text>
                {atual && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </Pressable>
            );
          })}

          <Pressable onPress={onClose} style={styles.cancelar}>
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  titulo: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  sub: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  opcao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  opcaoAtual: { borderColor: colors.primary },
  opcaoPressionada: { borderColor: colors.primary, backgroundColor: '#2a0a10' },
  opcaoTexto: { color: colors.text, fontSize: 16 },
  cancelar: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelarTexto: { color: colors.muted, fontSize: 15 },
});