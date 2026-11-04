import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { SeletorTemporada } from '../../components/SeletorTemporada';
import { Text } from '../../components/Text';
import {
  Categoria,
  ItemLista,
  listarCategorias,
  listarItens,
  listarTemporadas,
} from '../../db/repo';
import { useEpisodiosDaSemana } from '../../hooks/useEpisodiosDaSemana';
import { colors } from '../../theme';
import {
  compararTemporadas,
  formatarDataEp,
  Temporada,
  temporadaAtual,
  tempoRelativo,
} from '../../utils/format';

const LANCAMENTOS = 'lancamentos' as const;
type Aba = number | typeof LANCAMENTOS;

export default function ListaScreen() {
  const db = useSQLiteContext();
  const atual = temporadaAtual();
  const semana = useEpisodiosDaSemana(); // temporada atual + episódios + cache

  const [temporada, setTemporada] = useState<Temporada>(atual);
  const [temporadas, setTemporadas] = useState<Temporada[]>([atual]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [itensAntigos, setItensAntigos] = useState<ItemLista[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<Aba>(LANCAMENTOS);

  const ehAtual =
    temporada.season === atual.season && temporada.ano === atual.ano;

  // Categorias, temporadas disponíveis e (se for o caso) itens de temporada antiga
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      (async () => {
        const [cats, temps] = await Promise.all([
          listarCategorias(db),
          listarTemporadas(db),
        ]);
        if (!ativo) return;
        setCategorias(cats);
        setTemporadas(
          [atual, ...temps]
            .filter(
              (t, i, arr) =>
                arr.findIndex(
                  (o) => o.season === t.season && o.ano === t.ano,
                ) === i,
            )
            .sort(compararTemporadas),
        );

        if (!ehAtual) {
          const its = await listarItens(db, temporada.season, temporada.ano);
          if (ativo) setItensAntigos(its);
        }
      })();

      return () => {
        ativo = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, temporada.season, temporada.ano, ehAtual]),
  );

  const itens = ehAtual ? semana.itens : itensAntigos;

  // Próximos primeiro (mais perto antes), depois os que já saíram (mais recente antes)
  const lancamentos = useMemo(() => {
    const agora = Date.now() / 1000;
    const proximos = semana.episodios
      .filter((e) => e.airingAt >= agora)
      .sort((a, b) => a.airingAt - b.airingAt);
    const saidos = semana.episodios
      .filter((e) => e.airingAt < agora)
      .sort((a, b) => b.airingAt - a.airingAt);
    return [...proximos, ...saidos];
  }, [semana.episodios]);

  function trocarTemporada(t: Temporada) {
    const vaiParaAtual = t.season === atual.season && t.ano === atual.ano;
    setTemporada(t);
    setAbaAtiva(vaiParaAtual ? LANCAMENTOS : (categorias[0]?.id ?? LANCAMENTOS));
  }

  const abas: { id: Aba; nome: string; qtd: number }[] = [
    ...(ehAtual
      ? [{ id: LANCAMENTOS as Aba, nome: 'Lançamentos', qtd: lancamentos.length }]
      : []),
    ...categorias.map((c) => ({
      id: c.id as Aba,
      nome: c.nome,
      qtd: itens.filter((i) => i.categoria_id === c.id).length,
    })),
  ];

  return (
    <Screen title="Minha lista">
      <SeletorTemporada
        valor={temporada}
        opcoes={temporadas}
        onChange={trocarTemporada}
      />

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.abas}
        >
          {abas.map((a) => {
            const ativa = a.id === abaAtiva;
            return (
              <Pressable
                key={String(a.id)}
                onPress={() => setAbaAtiva(a.id)}
                style={[styles.aba, ativa && styles.abaAtiva]}
              >
                <Text style={[styles.abaTexto, ativa && styles.abaTextoAtivo]}>
                  {a.nome}
                  {a.qtd > 0 ? ` (${a.qtd})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {abaAtiva === LANCAMENTOS ? (
        <FlatList
          data={lancamentos}
          keyExtractor={(l) => l.chave}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            <>
              {semana.carregando && (
                <ActivityIndicator
                  color={colors.primary}
                  style={{ marginVertical: 8 }}
                />
              )}
              {semana.erro && <Text style={styles.erro}>{semana.erro}</Text>}
            </>
          }
          ListEmptyComponent={
            !semana.carregando ? (
              <Text style={styles.vazio}>
                Nenhum episódio dos seus animes nesta semana.
              </Text>
            ) : null
          }
          renderItem={({ item: l }) => {
            const jaSaiu = l.airingAt * 1000 < Date.now();
            return (
              <CardAnime item={l.item}>
                <Text style={styles.info}>
                  Ep {l.episodio} · {formatarDataEp(l.airingAt)}
                </Text>
                <Text style={jaSaiu ? styles.saiu : styles.proximo}>
                  {jaSaiu
                    ? `Saiu ${tempoRelativo(l.airingAt)}`
                    : tempoRelativo(l.airingAt)}
                </Text>
              </CardAnime>
            );
          }}
        />
      ) : (
        <FlatList
          data={itens.filter((i) => i.categoria_id === abaAtiva)}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              {ehAtual
                ? 'Nenhum anime aqui ainda. Adicione pela aba Buscar.'
                : 'Nenhum anime nesta categoria nesta temporada.'}
            </Text>
          }
          renderItem={({ item }) => (
            <CardAnime item={item}>
              <Text style={styles.info}>
                Assistidos: {item.assistidos}
                {item.total_eps ? ` / ${item.total_eps}` : ''}
              </Text>
            </CardAnime>
          )}
        />
      )}
    </Screen>
  );
}

/** Card base: capa + título; tocar abre o detalhe já sabendo a temporada */
function CardAnime({
  item,
  children,
}: {
  item: ItemLista;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/anime/[id]',
          params: {
            id: String(item.anilist_id),
            temporada: item.temporada,
            ano: String(item.ano),
          },
        })
      }
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
    >
      {item.capa && <Image source={{ uri: item.capa }} style={styles.capa} />}
      <View style={styles.textos}>
        <Text style={styles.titulo} numberOfLines={2}>
          {item.titulo}
        </Text>
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  abas: { gap: 8, paddingBottom: 12 },
  aba: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  abaAtiva: { backgroundColor: colors.primary, borderColor: colors.primary },
  abaTexto: { color: colors.muted, fontSize: 14 },
  abaTextoAtivo: { color: colors.text, fontWeight: '600' },
  vazio: { color: colors.muted, textAlign: 'center', marginTop: 32 },
  erro: { color: colors.primary, textAlign: 'center', marginVertical: 8 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  capa: { width: 64, height: 90 },
  textos: { flex: 1, padding: 10, justifyContent: 'center', gap: 4 },
  titulo: { color: colors.text, fontSize: 16, fontWeight: '600' },
  info: { color: colors.muted, fontSize: 13 },
  proximo: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  saiu: { color: colors.text, fontSize: 13 },
});