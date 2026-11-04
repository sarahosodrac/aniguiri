import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Text } from '../../components/Text';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { definirAssistidos } from '../../db/repo';
import {
  EpisodioDaLista,
  useEpisodiosDaSemana,
} from '../../hooks/useEpisodiosDaSemana';
import { colors } from '../../theme';
import {
  formatarHora,
  mesmoDia,
  semanaAtual,
  tempoRelativo,
} from '../../utils/format';

const NOMES_DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function AgendaScreen() {
  const db = useSQLiteContext();
  const { episodios, carregando, erro, atualizarAssistidos } =
    useEpisodiosDaSemana();

  const hoje = new Date();
  const indiceHoje = (hoje.getDay() + 6) % 7;
  const [diaSelecionado, setDiaSelecionado] = useState(indiceHoje);

  // As 7 datas da semana, começando na segunda
  const { inicio } = semanaAtual();
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio * 1000);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Texto do subtítulo conforme o dia selecionado
  const diaAtual = dias[diaSelecionado];
  const nomeDia = diaAtual.toLocaleDateString('pt-BR', { weekday: 'long' });
  const diferenca = diaSelecionado - indiceHoje;

  const rotuloDia =
    diferenca === 0
      ? `Hoje, ${nomeDia}`
      : diferenca === 1
        ? `Amanhã, ${nomeDia}`
        : diferenca === -1
          ? `Ontem, ${nomeDia}`
          : `${nomeDia.charAt(0).toUpperCase()}${nomeDia.slice(1)}, ${diaAtual.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;

  const epsDoDia = (dia: Date) =>
    episodios
      .filter((e) => mesmoDia(new Date(e.airingAt * 1000), dia))
      .sort((a, b) => a.airingAt - b.airingAt);

  const lista = epsDoDia(diaAtual);

  async function alternarVisto(e: EpisodioDaLista) {
    const jaVisto = e.item.assistidos >= e.episodio;
    const novo = jaVisto ? e.episodio - 1 : e.episodio;
    await definirAssistidos(db, e.item.id, novo);
    atualizarAssistidos(e.item.id, novo);
  }

  return (
    <Screen marca title="Agenda" subtitle={`${rotuloDia} · Animes do Dia`}>
      <View style={styles.dias}>
        {dias.map((d, i) => {
          const ativo = i === diaSelecionado;
          const temEp = epsDoDia(d).length > 0;
          return (
            <Pressable
              key={i}
              onPress={() => setDiaSelecionado(i)}
              style={[styles.dia, ativo && styles.diaAtivo]}
            >
              <Text style={[styles.diaNome, ativo && styles.diaTextoAtivo]}>
                {NOMES_DIAS[i]}
              </Text>
              <Text style={[styles.diaNumero, ativo && styles.diaTextoAtivo]}>
                {d.getDate()}
              </Text>
              <View
                style={[
                  styles.ponto,
                  temEp && {
                    backgroundColor: ativo ? colors.text : colors.primary,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {carregando && (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginVertical: 8 }}
        />
      )}
      {erro && <Text style={styles.erro}>{erro}</Text>}

      <FlatList
        data={lista}
        keyExtractor={(e) => e.chave}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !carregando ? (
            <Text style={styles.vazio}>Nenhum episódio neste dia.</Text>
          ) : null
        }
        renderItem={({ item: e }) => {
          const visto = e.item.assistidos >= e.episodio;
          const jaSaiu = e.airingAt * 1000 < Date.now();
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/anime/[id]',
                  params: { id: String(e.item.anilist_id) },
                })
              }
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.faixa} />
              {e.item.capa && (
                <Image source={{ uri: e.item.capa }} style={styles.capa} />
              )}
              <View style={styles.textos}>
                <Text style={styles.titulo} numberOfLines={2}>
                  {e.item.titulo}
                </Text>
                <Text style={styles.info}>
                  Ep {e.episodio} · {formatarHora(e.airingAt)}
                </Text>
                <Text style={jaSaiu ? styles.saiu : styles.proximo}>
                  {jaSaiu
                    ? `Saiu ${tempoRelativo(e.airingAt)}`
                    : tempoRelativo(e.airingAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => alternarVisto(e)}
                style={[styles.botao, visto && styles.botaoVisto]}
              >
                <Text style={styles.botaoTexto}>
                  {visto ? 'Visto ✓' : 'Visto'}
                </Text>
              </Pressable>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dias: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  dia: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diaAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  diaNome: { color: colors.muted, fontSize: 12 },
  diaNumero: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  diaTextoAtivo: { color: colors.text },
  ponto: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  vazio: { color: colors.muted, textAlign: 'center', marginTop: 32 },
  erro: { color: colors.primary, textAlign: 'center', marginVertical: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  faixa: { width: 4, alignSelf: 'stretch', backgroundColor: colors.primary },
  capa: { width: 64, height: 90 },
  textos: { flex: 1, padding: 10, gap: 3 },
  titulo: { color: colors.text, fontSize: 16, fontWeight: '600' },
  info: { color: colors.muted, fontSize: 13 },
  proximo: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  saiu: { color: colors.text, fontSize: 13 },
  botao: {
    marginRight: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  botaoVisto: { backgroundColor: colors.primary, borderColor: colors.primary },
  botaoTexto: { color: colors.text, fontSize: 14, fontWeight: '600' },
});