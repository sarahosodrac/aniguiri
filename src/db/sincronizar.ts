import { SQLiteDatabase } from 'expo-sqlite';
import { buscarResumos } from '../api/anilist';
import { salvarCache } from './repo';

const VALIDADE_MS = 6 * 60 * 60 * 1000; // 6 horas

/**
 * Atualiza no cache os animes que estão desatualizados.
 * Retorna true se algo mudou (para quem chamou recarregar a lista).
 */
export async function atualizarCache(
  db: SQLiteDatabase,
  ids: number[],
): Promise<boolean> {
  if (ids.length === 0) return false;

  const limite = Date.now() - VALIDADE_MS;
  const marcadores = ids.map(() => '?').join(', ');
  const velhos = await db.getAllAsync<{ anilist_id: number }>(
    `SELECT anilist_id FROM anime_cache
     WHERE atualizado_em < ? AND anilist_id IN (${marcadores})`,
    [limite, ...ids],
  );
  if (velhos.length === 0) return false;

  const animes = await buscarResumos(velhos.map((v) => v.anilist_id));
  await db.withTransactionAsync(async () => {
    for (const a of animes) await salvarCache(db, a);
  });
  return true;
}