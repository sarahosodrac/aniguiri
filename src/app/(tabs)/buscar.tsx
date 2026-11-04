import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Text } from '../../components/Text';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { AnimeResumo, buscarAnimes } from '../../api/anilist';
import { AnimeCard } from '../../components/AnimeCard';
import { EscolherCategoriaModal } from '../../components/EscolherCategoriaModal';
import { Screen } from '../../components/Screen';
import { idsNaLista } from '../../db/repo';
import { colors, fonts } from '../../theme';
import { temporadaAtual } from '../../utils/format';

export default function BuscarScreen() {
  const db = useSQLiteContext();
  const { season, ano } = temporadaAtual();

  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<AnimeResumo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<AnimeResumo | null>(null);
  const [salvos, setSalvos] = useState<Set<number>>(new Set());

  // Atualiza os marcadores toda vez que a aba ganha foco
  useFocusEffect(
    useCallback(() => {
      idsNaLista(db, season, ano).then(setSalvos);
    }, [db, season, ano]),
  );

  // Busca no AniList com debounce de 500 ms
  useEffect(() => {
    const texto = termo.trim();
    if (texto.length < 2) {
      setResultados([]);
      setErro(null);
      return;
    }

    let cancelado = false;
    const timer = setTimeout(async () => {
      setCarregando(true);
      setErro(null);
      try {
        const r = await buscarAnimes(texto);
        if (!cancelado) setResultados(r);
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : 'Erro ao buscar');
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }, 500);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [termo]);

  return (
    <Screen title="Buscar" subtitle="Pesquisa tchola">
      <TextInput
        value={termo}
        onChangeText={setTermo}
        placeholder="Nome do anime..."
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
      />

      {carregando && (
        <ActivityIndicator color={colors.primary} style={styles.aviso} />
      )}
      {erro && <Text style={[styles.aviso, styles.erro]}>{erro}</Text>}

      <FlatList
        data={resultados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AnimeCard
            anime={item}
            naLista={salvos.has(item.id)}
            onPress={() => {
            console.log('tocou em', item.title.romaji);
            setSelecionado(item);
          }}
          />
        )}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <EscolherCategoriaModal
        anime={selecionado}
        onClose={() => setSelecionado(null)}
        onSalvo={(id) => setSalvos((s) => new Set(s).add(id))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  aviso: { marginVertical: 8 },
  erro: { color: colors.primary, textAlign: 'center' },
});