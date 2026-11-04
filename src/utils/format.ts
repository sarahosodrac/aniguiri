import { MediaSeason } from '../api/anilist';

const TEMPORADAS: Record<MediaSeason, string> = {
  WINTER: 'Inverno',
  SPRING: 'Primavera',
  SUMMER: 'Verão',
  FALL: 'Outono',
};

const STATUS: Record<string, string> = {
  RELEASING: 'Em exibição',
  FINISHED: 'Finalizado',
  NOT_YET_RELEASED: 'Não lançado',
  CANCELLED: 'Cancelado',
  HIATUS: 'Em hiato',
};

export function nomeTemporada(
  season: MediaSeason | null,
  year: number | null,
): string | null {
  if (!season || !year) return null;
  return `${TEMPORADAS[season]} ${year}`;
}

export function nomeStatus(status: string): string {
  return STATUS[status] ?? status;
}

export function formatarDataEp(airingAt: number): string {
  const data = new Date(airingAt * 1000);
  const dia = data.toLocaleDateString('pt-BR', { weekday: 'short' });
  const hora = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dia} ${hora}`;
}
export function temporadaAtual(data = new Date()): {
  season: MediaSeason;
  ano: number;
} {
  const mes = data.getMonth(); // 0 = janeiro
  const season: MediaSeason =
    mes < 3 ? 'WINTER' : mes < 6 ? 'SPRING' : mes < 9 ? 'SUMMER' : 'FALL';
  return { season, ano: data.getFullYear() };
}
/** Início (segunda 00:00) e fim (próxima segunda 00:00) da semana atual, em segundos. */
export function semanaAtual(agora = new Date()) {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));

  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 7);

  return {
    inicio: Math.floor(inicio.getTime() / 1000),
    fim: Math.floor(fim.getTime() / 1000),
  };
}

/** "em 6h", "em 2d", "há 30min"... */
export function tempoRelativo(airingAt: number, agora = Date.now()): string {
  const diffMin = Math.round((airingAt * 1000 - agora) / 60000);
  const abs = Math.abs(diffMin);
  const texto =
    abs < 60
      ? `${abs}min`
      : abs < 1440
        ? `${Math.round(abs / 60)}h`
        : `${Math.round(abs / 1440)}d`;
  return diffMin >= 0 ? `em ${texto}` : `há ${texto}`;
}
export function formatarHora(airingAt: number): string {
  return new Date(airingAt * 1000).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
/** A sinopse do AniList vem com tags HTML (<br>, <i>...). Aqui limpamos. */
export function limparSinopse(texto: string | null): string {
  if (!texto) return 'Sem sinopse disponível.';
  return texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const FORMATOS: Record<string, string> = {
  TV: 'Série de TV',
  TV_SHORT: 'TV curta',
  MOVIE: 'Filme',
  SPECIAL: 'Especial',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Clipe',
};

export function nomeFormato(formato: string | null): string | null {
  if (!formato) return null;
  return FORMATOS[formato] ?? formato;
}
export type Temporada = { season: MediaSeason; ano: number };

const ORDEM_TEMPORADA: Record<MediaSeason, number> = {
  WINTER: 0,
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
};

/** Para ordenar da temporada mais recente para a mais antiga. */
export function compararTemporadas(a: Temporada, b: Temporada): number {
  return b.ano - a.ano || ORDEM_TEMPORADA[b.season] - ORDEM_TEMPORADA[a.season];
}