import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { AnimeResumo } from '../api/anilist';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { formatarDataEp, nomeStatus, nomeTemporada } from '../utils/format';

type Props = {
  anime: AnimeResumo;
  naLista?: boolean;
  onPress?: () => void;
};

export function AnimeCard({ anime, naLista, onPress }: Props) {
  const temporada = nomeTemporada(anime.season, anime.seasonYear);
  const infos = [
    nomeStatus(anime.status),
    temporada,
    anime.episodes ? `${anime.episodes} eps` : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
    >
      <Image source={{ uri: anime.coverImage.large }} style={styles.capa} />
      <View style={styles.textos}>
        <Text style={styles.titulo} numberOfLines={2}>
          {anime.title.romaji}
        </Text>
        <Text style={styles.info}>{infos.join(' · ')}</Text>
        {anime.nextAiringEpisode && (
          <Text style={styles.proximo}>
            Ep {anime.nextAiringEpisode.episode} ·{' '}
            {formatarDataEp(anime.nextAiringEpisode.airingAt)}
          </Text>
        )}
      </View>
            {naLista && (
        <Ionicons
          name="bookmark"
          size={20}
          color={colors.primary}
          style={{ position: 'absolute', top: 8, right: 8 }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  capa: { width: 64, height: 90, backgroundColor: colors.border },
  textos: { flex: 1, padding: 10, justifyContent: 'center', gap: 4 },
  titulo: { color: colors.text, fontSize: 16, fontWeight: '600' },
  info: { color: colors.muted, fontSize: 13 },
  proximo: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});