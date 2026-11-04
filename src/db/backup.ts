import { SQLiteDatabase } from 'expo-sqlite';
import { MediaSeason } from '../api/anilist';

export const VERSAO_BACKUP = 1;

export type AnimeBackup = {
  anilist_id: number;
  titulo: string;
  capa: string | null;
  cor: string | null;
  total_eps: number | null;
  status: string | null;
  prox_ep: number | null;
  prox_ep_em: number | null;
  categoria: string; // pelo NOME: os ids podem ser diferentes em outro celular
  temporada: MediaSeason;
  ano: number;
  assistidos: number;
  criado_em: number;
};

export type Backup = {
  app: 'aniguiri';
  versao: number;
  exportado_em: string;
  categorias: { nome: string; ordem: number }[];
  animes: AnimeBackup[];
};

export async function exportarDados(db: SQLiteDatabase): Promise<Backup> {
  const categorias = await db.getAllAsync<{ nome: string; ordem: number }>(
    'SELECT nome, ordem FROM categorias ORDER BY ordem, id',
  );
  const animes = await db.getAllAsync<AnimeBackup>(
    `SELECT l.anilist_id, c.titulo, c.capa, c.cor, c.total_eps, c.status,
            c.prox_ep, c.prox_ep_em, cat.nome AS categoria,
            l.temporada, l.ano, l.assistidos, l.criado_em
     FROM lista l
     JOIN anime_cache c ON c.anilist_id = l.anilist_id
     JOIN categorias cat ON cat.id = l.categoria_id
     ORDER BY l.ano, l.temporada, c.titulo`,
  );
  return {
    app: 'aniguiri',
    versao: VERSAO_BACKUP,
    exportado_em: new Date().toISOString(),
    categorias,
    animes,
  };
}

/** Confere se o JSON é mesmo um backup do Aniguiri. */
export function validarBackup(dados: unknown): Backup {
  const d = dados as Partial<Backup> | null;
  if (
    !d ||
    d.app !== 'aniguiri' ||
    !Array.isArray(d.animes) ||
    !Array.isArray(d.categorias)
  ) {
    throw new Error('Este arquivo não é um backup do Aniguiri.');
  }
  if ((d.versao ?? 0) > VERSAO_BACKUP) {
    throw new Error(
      'Este backup foi feito por uma versão mais nova do app. Atualize o Aniguiri.',
    );
  }
  return d as Backup;
}

/**
 * Junta o backup com a lista atual (não apaga nada).
 * Animes que já existem ficam com a categoria do backup e o maior "assistidos".
 */
export async function importarDados(
  db: SQLiteDatabase,
  backup: Backup,
): Promise<number> {
  let importados = 0;

  await db.withTransactionAsync(async () => {
    for (const c of backup.categorias) {
      await db.runAsync(
        'INSERT INTO categorias (nome, ordem) VALUES (?, ?) ON CONFLICT(nome) DO NOTHING',
        [c.nome, c.ordem],
      );
    }

    const cats = await db.getAllAsync<{ id: number; nome: string }>(
      'SELECT id, nome FROM categorias',
    );
    const idPorNome = new Map(cats.map((c) => [c.nome, c.id]));

    for (const a of backup.animes) {
      const categoriaId = idPorNome.get(a.categoria);
      if (!categoriaId) continue;

      // atualizado_em = 0 força o app a atualizar esse anime no próximo uso
      await db.runAsync(
        `INSERT INTO anime_cache
           (anilist_id, titulo, capa, cor, total_eps, status, prox_ep, prox_ep_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(anilist_id) DO NOTHING`,
        [
          a.anilist_id,
          a.titulo,
          a.capa,
          a.cor,
          a.total_eps,
          a.status,
          a.prox_ep,
          a.prox_ep_em,
        ],
      );

      await db.runAsync(
        `INSERT INTO lista (anilist_id, categoria_id, temporada, ano, assistidos, criado_em)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(anilist_id, temporada, ano) DO UPDATE SET
           categoria_id = excluded.categoria_id,
           assistidos = MAX(lista.assistidos, excluded.assistidos)`,
        [a.anilist_id, categoriaId, a.temporada, a.ano, a.assistidos, a.criado_em],
      );
      importados++;
    }
  });

  return importados;
}