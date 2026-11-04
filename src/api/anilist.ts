const ANILIST_URL = 'https://graphql.anilist.co';

export type MediaSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export type AnimeResumo = {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string; color: string | null };
  format: string | null;
  episodes: number | null;
  season: MediaSeason | null;
  seasonYear: number | null;
  status: string;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
};

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message ?? `Erro HTTP ${res.status}`);
  }
  return json.data as T;
}

const BUSCA_QUERY = `
  query ($search: String) {
    Page(perPage: 20) {
      media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
        id
        title { romaji english }
        coverImage { large color }
        format
        episodes
        season
        seasonYear
        status
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`;

export async function buscarAnimes(termo: string): Promise<AnimeResumo[]> {
  const data = await graphql<{ Page: { media: AnimeResumo[] } }>(
    BUSCA_QUERY,
    { search: termo },
  );
  return data.Page.media;
}

export type EpisodioAgenda = {
  id: number;
  episode: number;
  airingAt: number;
  mediaId: number;
};

const EPISODIOS_QUERY = `
  query ($ids: [Int], $inicio: Int, $fim: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      airingSchedules(
        mediaId_in: $ids
        airingAt_greater: $inicio
        airingAt_lesser: $fim
        sort: TIME
      ) {
        id
        episode
        airingAt
        mediaId
      }
    }
  }
`;

/** Episódios dos animes `ids` entre `inicio` e `fim` (timestamps em segundos). */
export async function buscarEpisodios(
  ids: number[],
  inicio: number,
  fim: number,
): Promise<EpisodioAgenda[]> {
  if (ids.length === 0) return [];

  const todos: EpisodioAgenda[] = [];
  let page = 1;
  while (true) {
    const data = await graphql<{
      Page: {
        pageInfo: { hasNextPage: boolean };
        airingSchedules: EpisodioAgenda[];
      };
    }>(EPISODIOS_QUERY, { ids, inicio, fim, page });

    todos.push(...data.Page.airingSchedules);
    if (!data.Page.pageInfo.hasNextPage) break;
    page++;
  }
  return todos;
}
export type AnimeDetalhe = AnimeResumo & {
  title: { native: string | null };
  description: string | null;
  bannerImage: string | null;
  genres: string[];
  averageScore: number | null;
  duration: number | null;
  studios: { nodes: { name: string }[] };
};

const DETALHE_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      coverImage { large color }
      bannerImage
      format
      episodes
      duration
      season
      seasonYear
      status
      description(asHtml: false)
      genres
      averageScore
      studios(isMain: true) { nodes { name } }
      nextAiringEpisode { episode airingAt }
    }
  }
`;

export async function buscarDetalhe(id: number): Promise<AnimeDetalhe> {
  const data = await graphql<{ Media: AnimeDetalhe }>(DETALHE_QUERY, { id });
  return data.Media;
}
const RESUMOS_QUERY = `
  query ($ids: [Int], $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      media(id_in: $ids, type: ANIME) {
        id
        title { romaji english }
        coverImage { large color }
        format
        episodes
        season
        seasonYear
        status
        nextAiringEpisode { episode airingAt }
      }
    }
  }
`;

/** Busca vários animes de uma vez pelos ids. */
export async function buscarResumos(ids: number[]): Promise<AnimeResumo[]> {
  if (ids.length === 0) return [];

  const todos: AnimeResumo[] = [];
  let page = 1;
  while (true) {
    const data = await graphql<{
      Page: { pageInfo: { hasNextPage: boolean }; media: AnimeResumo[] };
    }>(RESUMOS_QUERY, { ids, page });

    todos.push(...data.Page.media);
    if (!data.Page.pageInfo.hasNextPage) break;
    page++;
  }
  return todos;
}