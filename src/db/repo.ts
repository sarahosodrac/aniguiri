import { SQLiteDatabase } from 'expo-sqlite';
import { AnimeResumo, MediaSeason } from '../api/anilist';

// ---------- Tipos ----------

export type Categoria = { id: number; nome: string; ordem: number };

export type ItemLista = {
  id: number;
  anilist_id: number;
  categoria_id: number;
  temporada: MediaSeason;
  ano: number;
  assistidos: number;
  titulo: string;
  capa: string | null;
  total_eps: number | null;
  status: string | null;
  prox_ep: number | null;
  prox_ep_em: number | null;
};

export type ItemDetalhe = ItemLista & { categoria_nome: string };

// ---------- Categorias ----------

export function listarCategorias(db: SQLiteDatabase) {
  return db.getAllAsync<Categoria>(
    'SELECT * FROM categorias ORDER BY ordem, id',
  );
}

// ---------- Cache de animes ----------

export async function salvarCache(db: SQLiteDatabase, a: AnimeResumo) {
  await db.runAsync(
    `INSERT INTO anime_cache
       (anilist_id, titulo, capa, cor, total_eps, status, prox_ep, prox_ep_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(anilist_id) DO UPDATE SET
       titulo = excluded.titulo,
       capa = excluded.capa,
       cor = excluded.cor,
       total_eps = excluded.total_eps,
       status = excluded.status,
       prox_ep = excluded.prox_ep,
       prox_ep_em = excluded.prox_ep_em,
       atualizado_em = excluded.atualizado_em`,
    [
      a.id,
      a.title.romaji,
      a.coverImage.large,
      a.coverImage.color,
      a.episodes,
      a.status,
      a.nextAiringEpisode?.episode ?? null,
      a.nextAiringEpisode?.airingAt ?? null,
      Date.now(),
    ],
  );
}

// ---------- Lista ----------

export async function adicionarNaLista(
  db: SQLiteDatabase,
  anime: AnimeResumo,
  categoriaId: number,
  temporada: MediaSeason,
  ano: number,
) {
  await db.withTransactionAsync(async () => {
    await salvarCache(db, anime);
    await db.runAsync(
      `INSERT INTO lista (anilist_id, categoria_id, temporada, ano, criado_em)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(anilist_id, temporada, ano)
       DO UPDATE SET categoria_id = excluded.categoria_id`,
      [anime.id, categoriaId, temporada, ano, Date.now()],
    );
  });
}

export async function idsNaLista(
  db: SQLiteDatabase,
  temporada: MediaSeason,
  ano: number,
): Promise<Set<number>> {
  const rows = await db.getAllAsync<{ anilist_id: number }>(
    'SELECT anilist_id FROM lista WHERE temporada = ? AND ano = ?',
    [temporada, ano],
  );
  return new Set(rows.map((r) => r.anilist_id));
}

export function listarItens(
  db: SQLiteDatabase,
  temporada: MediaSeason,
  ano: number,
) {
  return db.getAllAsync<ItemLista>(
    `SELECT l.*, c.titulo, c.capa, c.total_eps, c.status, c.prox_ep, c.prox_ep_em
     FROM lista l
     JOIN anime_cache c ON c.anilist_id = l.anilist_id
     WHERE l.temporada = ? AND l.ano = ?
     ORDER BY c.titulo`,
    [temporada, ano],
  );
}

export function buscarItem(
  db: SQLiteDatabase,
  anilistId: number,
  temporada: MediaSeason,
  ano: number,
) {
  return db.getFirstAsync<ItemDetalhe>(
    `SELECT l.*, c.titulo, c.capa, c.total_eps, c.status, c.prox_ep, c.prox_ep_em,
            cat.nome AS categoria_nome
     FROM lista l
     JOIN anime_cache c ON c.anilist_id = l.anilist_id
     JOIN categorias cat ON cat.id = l.categoria_id
     WHERE l.anilist_id = ? AND l.temporada = ? AND l.ano = ?`,
    [anilistId, temporada, ano],
  );
}

export async function definirAssistidos(
  db: SQLiteDatabase,
  listaId: number,
  valor: number,
) {
  await db.runAsync('UPDATE lista SET assistidos = ? WHERE id = ?', [
    Math.max(0, valor),
    listaId,
  ]);
}

export async function removerDaLista(db: SQLiteDatabase, listaId: number) {
  await db.runAsync('DELETE FROM lista WHERE id = ?', [listaId]);
}
export async function listarTemporadas(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ temporada: MediaSeason; ano: number }>(
    'SELECT DISTINCT temporada, ano FROM lista',
  );
  return rows.map((r) => ({ season: r.temporada, ano: r.ano }));
}