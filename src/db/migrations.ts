import { SQLiteDatabase } from 'expo-sqlite';

const VERSAO_ATUAL = 2;

export async function migrar(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  let versao = row?.user_version ?? 0;
  if (versao >= VERSAO_ATUAL) return;

  // Versão 1: criação das tabelas
  if (versao === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE categorias (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        nome  TEXT NOT NULL UNIQUE,
        ordem INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE anime_cache (
        anilist_id    INTEGER PRIMARY KEY,
        titulo        TEXT NOT NULL,
        capa          TEXT,
        cor           TEXT,
        total_eps     INTEGER,
        status        TEXT,
        prox_ep       INTEGER,
        prox_ep_em    INTEGER,
        atualizado_em INTEGER NOT NULL
      );

      CREATE TABLE lista (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        anilist_id   INTEGER NOT NULL REFERENCES anime_cache(anilist_id),
        categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
        temporada    TEXT NOT NULL,
        ano          INTEGER NOT NULL,
        assistidos   INTEGER NOT NULL DEFAULT 0,
        criado_em    INTEGER NOT NULL,
        UNIQUE (anilist_id, temporada, ano)
      );

      INSERT INTO categorias (nome, ordem) VALUES
        ('Lançamentos', 0),
        ('Apostas', 1),
        ('Chance', 2),
        ('Continuação', 3);
    `);
    versao = 1;
  }

  // Versão 2: "Lançamentos" deixa de ser categoria (vira aba automática)
  if (versao === 1) {
    await db.execAsync(`
      UPDATE lista
      SET categoria_id = (
        SELECT id FROM categorias
        WHERE nome <> 'Lançamentos'
        ORDER BY ordem, id LIMIT 1
      )
      WHERE categoria_id = (
        SELECT id FROM categorias WHERE nome = 'Lançamentos'
      );

      DELETE FROM categorias WHERE nome = 'Lançamentos';
    `);
    versao = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${versao}`);
}