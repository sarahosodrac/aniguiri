import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { buscarEpisodios } from '../api/anilist';
import { ItemLista, listarItens } from '../db/repo';
import { atualizarCache } from '../db/sincronizar';
import { semanaAtual, temporadaAtual } from '../utils/format';

export type EpisodioDaLista = {
  chave: string;
  item: ItemLista;
  episodio: number;
  airingAt: number;
};

/**
 * Animes da temporada atual + episódios desta semana (seg–dom).
 * Também atualiza o cache dos animes que estiverem desatualizados.
 */
export function useEpisodiosDaSemana() {
  const db = useSQLiteContext();
  const { season, ano } = temporadaAtual();

  const [itens, setItens] = useState<ItemLista[]>([]);
  const [episodios, setEpisodios] = useState<EpisodioDaLista[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      (async () => {
        setCarregando(true);
        setErro(null);
        try {
          // 1. Lista local: aparece na hora, mesmo sem internet
          let its = await listarItens(db, season, ano);
          if (!ativo) return;
          setItens(its);

          // 2. Atualiza o cache (se falhar, segue com o que tem)
          try {
            const mudou = await atualizarCache(
              db,
              its.map((i) => i.anilist_id),
            );
            if (mudou) {
              its = await listarItens(db, season, ano);
              if (!ativo) return;
              setItens(its);
            }
          } catch {
            // sem internet: tudo bem, usamos o cache
          }

          // 3. Episódios da semana
          const { inicio, fim } = semanaAtual();
          const eps = await buscarEpisodios(
            its.map((i) => i.anilist_id),
            inicio,
            fim,
          );
          if (!ativo) return;

          const porId = new Map(its.map((i) => [i.anilist_id, i]));
          setEpisodios(
            eps
              .filter((e) => porId.has(e.mediaId))
              .map((e) => ({
                chave: String(e.id),
                item: porId.get(e.mediaId)!,
                episodio: e.episode,
                airingAt: e.airingAt,
              })),
          );
        } catch (e) {
          if (ativo) {
            setErro(e instanceof Error ? e.message : 'Erro ao buscar episódios');
          }
        } finally {
          if (ativo) setCarregando(false);
        }
      })();

      return () => {
        ativo = false;
      };
    }, [db, season, ano]),
  );

  /** Atualiza o "assistidos" na memória, sem buscar tudo de novo. */
  function atualizarAssistidos(listaId: number, valor: number) {
    setItens((atual) =>
      atual.map((i) => (i.id === listaId ? { ...i, assistidos: valor } : i)),
    );
    setEpisodios((atual) =>
      atual.map((e) =>
        e.item.id === listaId
          ? { ...e, item: { ...e.item, assistidos: valor } }
          : e,
      ),
    );
  }

  return { itens, episodios, carregando, erro, atualizarAssistidos };
}