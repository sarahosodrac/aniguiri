import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Text } from '../../components/Text';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimeDetalhe, buscarDetalhe,  MediaSeason } from '../../api/anilist';
import { EscolherCategoriaModal } from '../../components/EscolherCategoriaModal';
import {
  buscarItem,
  definirAssistidos,
  ItemDetalhe,
  removerDaLista,
  salvarCache,
} from '../../db/repo';
import { colors } from '../../theme';
import {
  formatarDataEp,
  limparSinopse,
  nomeFormato,
  nomeStatus,
  nomeTemporada,
  temporadaAtual,
  tempoRelativo,
} from '../../utils/format';

export default function AnimeDetalheScreen() {
    const params = useLocalSearchParams<{
    id: string;
    temporada?: string;
    ano?: string;
  }>();
  const anilistId = Number(params.id);
  const db = useSQLiteContext();
  const atual = temporadaAtual();
  const season = (params.temporada as MediaSeason | undefined) ?? atual.season;
  const ano = params.ano ? Number(params.ano) : atual.ano;

  const [anime, setAnime] = useState<AnimeDetalhe | null>(null);
  const [item, setItem] = useState<ItemDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  const carregarItem = useCallback(async () => {
    const it = await buscarItem(db, anilistId, season, ano);
    setItem(it);
    return it;
  }, [db, anilistId, season, ano]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const it = await carregarItem(); // banco local: rápido e funciona offline
      try {
        const a = await buscarDetalhe(anilistId);
        if (!ativo) return;
        setAnime(a);
        if (it) await salvarCache(db, a); // mantém o cache atualizado
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : 'Erro ao carregar');
      }
    })();
    return () => {
      ativo = false;
    };
  }, [anilistId, carregarItem, db]);

  const total = anime?.episodes ?? item?.total_eps ?? null;

  async function alterarAssistidos(delta: number) {
    if (!item) return;
    let novo = item.assistidos + delta;
    if (novo < 0) novo = 0;
    if (total && novo > total) novo = total;
    await definirAssistidos(db, item.id, novo);
    setItem({ ...item, assistidos: novo });
  }

    async function remover() {
    if (!item) return;
    await removerDaLista(db, item.id);
    setItem(null);
    setConfirmandoRemocao(false);
  }

  if (!anime) {
    return (
      <SafeAreaView style={[styles.container, styles.centro]}>
        {erro ? (
          <>
            <Text style={styles.erro}>{erro}</Text>
            <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
              <Text style={styles.subtitulo}>Voltar</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={colors.primary} size="large" />
        )}
      </SafeAreaView>
    );
  }

  const prox = anime.nextAiringEpisode;
  const infosTopo = [
    nomeStatus(anime.status),
    anime.episodes ? `${anime.episodes} episódios` : null,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Topo com banner */}
        <View style={styles.topo}>
          <Image
            source={{ uri: anime.bannerImage ?? anime.coverImage.large }}
            style={styles.banner}
            blurRadius={anime.bannerImage ? 0 : 10}
          />
          <View style={styles.bannerSombra} />
          <Pressable
            onPress={() => router.back()}
            style={styles.voltar}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.conteudo}>
          {/* Capa + título */}
          <View style={styles.cabecalho}>
            <Image source={{ uri: anime.coverImage.large }} style={styles.capa} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.tituloLinha}>
                <View style={styles.barra} />
                <Text style={styles.titulo}>{anime.title.romaji}</Text>
              </View>
              {anime.title.english &&
                anime.title.english !== anime.title.romaji && (
                  <Text style={styles.subtitulo}>{anime.title.english}</Text>
                )}
              <Text style={styles.subtitulo}>{infosTopo.join(' · ')}</Text>
            </View>
          </View>

          {/* Próximo episódio */}
          {prox && (
            <View style={styles.proximo}>
              <Ionicons name="play-circle" size={20} color={colors.text} />
              <Text style={styles.proximoTexto}>
                Próximo: Ep {prox.episode} · {formatarDataEp(prox.airingAt)} (
                {tempoRelativo(prox.airingAt)})
              </Text>
            </View>
          )}

          {/* Controles da lista */}
          {item ? (
            <>
              <View style={styles.linhaBox}>
                <Text style={styles.linhaTexto}>
                  Assistidos: {item.assistidos}
                  {total ? ` / ${total}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => alterarAssistidos(-1)}
                    style={styles.botaoRedondo}
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </Pressable>
                  <Pressable
                    onPress={() => alterarAssistidos(1)}
                    style={[styles.botaoRedondo, styles.botaoPrimario]}
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => setModalAberto(true)}
                style={styles.linhaBox}
              >
                <Text style={styles.linhaTexto}>
                  Categoria: {item.categoria_nome}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.muted} />
              </Pressable>

              <Pressable onPress={() => setConfirmandoRemocao(true)}>
                <Text style={styles.removerTexto}>Remover da lista</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => setModalAberto(true)}
              style={styles.botaoAdicionar}
            >
              <Ionicons name="bookmark-outline" size={18} color={colors.text} />
              <Text style={styles.botaoAdicionarTexto}>Adicionar à lista</Text>
            </Pressable>
          )}

          {/* Sinopse */}
          <Text style={styles.secao}>Sinopse</Text>
          <Text style={styles.sinopse}>{limparSinopse(anime.description)}</Text>

          {/* Informações */}
          <Text style={styles.secao}>Informações</Text>
          <Info rotulo="Formato" valor={nomeFormato(anime.format)} />
          <Info
            rotulo="Temporada"
            valor={nomeTemporada(anime.season, anime.seasonYear)}
          />
          <Info
            rotulo="Duração"
            valor={anime.duration ? `${anime.duration} min por ep` : null}
          />
          <Info
            rotulo="Estúdio"
            valor={anime.studios.nodes.map((s) => s.name).join(', ') || null}
          />
          <Info rotulo="Gêneros" valor={anime.genres.join(', ') || null} />
          <Info
            rotulo="Nota"
            valor={anime.averageScore ? `${anime.averageScore}%` : null}
          />
        </View>
      </ScrollView>

      <EscolherCategoriaModal
        anime={modalAberto ? anime : null}
        temporada={{ season, ano }}
        categoriaAtualId={item?.categoria_id ?? null}
        onClose={() => setModalAberto(false)}
        onSalvo={() => carregarItem()}
      />

      <ConfirmDialog
        visivel={confirmandoRemocao}
        titulo="Remover da lista"
        mensagem={item ? `Remover "${item.titulo}" da sua lista?` : undefined}
        textoConfirmar="Remover"
        onConfirmar={remover}
        onCancelar={() => setConfirmandoRemocao(false)}
      />
    </SafeAreaView>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <View style={styles.info}>
      <Text style={styles.infoRotulo}>{rotulo}</Text>
      <Text style={styles.infoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centro: { justifyContent: 'center', alignItems: 'center' },
  erro: { color: colors.primary, textAlign: 'center', paddingHorizontal: 24 },

  topo: { height: 180 },
  banner: { ...StyleSheet.absoluteFillObject },
  bannerSombra: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,11,13,0.55)',
  },
  voltar: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    padding: 8,
  },

  conteudo: { paddingHorizontal: 16, marginTop: -60, gap: 12 },
  cabecalho: { flexDirection: 'row', gap: 14, alignItems: 'flex-end' },
  capa: {
    width: 100,
    height: 145,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  tituloLinha: { flexDirection: 'row', gap: 8 },
  barra: { width: 4, borderRadius: 2, backgroundColor: colors.primary },
  titulo: { flex: 1, color: colors.text, fontSize: 22, fontWeight: 'bold' },
  subtitulo: { color: colors.muted, fontSize: 14 },

  proximo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  proximoTexto: { color: colors.text, fontSize: 15, fontWeight: '600' },

  linhaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linhaTexto: { color: colors.text, fontSize: 15, fontWeight: '600' },
  botaoRedondo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  botaoPrimario: { backgroundColor: colors.primary },

  remover: { alignItems: 'center', paddingVertical: 6 },
  removerTexto: { color: colors.muted, fontSize: 14 },

  botaoAdicionar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  botaoAdicionarTexto: { color: colors.text, fontSize: 15, fontWeight: '600' },

  secao: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  sinopse: { color: colors.muted, fontSize: 14, lineHeight: 21 },

  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRotulo: { color: colors.muted, fontSize: 14 },
  infoValor: { color: colors.text, fontSize: 14, flex: 1, textAlign: 'right' },
});