import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { ComponentProps, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import {
  Backup,
  exportarDados,
  importarDados,
  validarBackup,
} from '../../db/backup';
import { colors } from '../../theme';

const GITHUB_URL = 'https://github.com/sarahosodrac/aniguiri';
const ANILIST_URL = 'https://anilist.co';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];
type Aviso = { tipo: 'ok' | 'erro'; texto: string } | null;

export default function AjustesScreen() {
  const db = useSQLiteContext();
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [pendente, setPendente] = useState<Backup | null>(null);

  const versao = Constants.expoConfig?.version ?? '—';

    function nomeBackup() {
    return `aniguiri-backup-${new Date().toISOString().slice(0, 10)}`;
  }

  async function salvarNoCelular() {
    setAviso(null);
    try {
      // Abre o seletor de pastas do Android
      const pasta = await Directory.pickDirectoryAsync();
      setOcupado(true);

      const dados = await exportarDados(db);
      const arquivo = pasta.createFile(nomeBackup(), 'application/json');
      arquivo.write(JSON.stringify(dados, null, 2));

      setAviso({
        tipo: 'ok',
        texto: `Backup com ${dados.animes.length} anime(s) salvo na pasta escolhida.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('cancel')) return; // fechou o seletor
      setAviso({ tipo: 'erro', texto: msg || 'Erro ao salvar.' });
    } finally {
      setOcupado(false);
    }
  }

  async function compartilhar() {
    setOcupado(true);
    setAviso(null);
    try {
      const dados = await exportarDados(db);
      const arquivo = new File(Paths.cache, `${nomeBackup()}.json`);
      if (arquivo.exists) arquivo.delete();
      arquivo.create();
      arquivo.write(JSON.stringify(dados, null, 2));

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Compartilhamento indisponível neste aparelho.');
      }
      await Sharing.shareAsync(arquivo.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Compartilhar backup do Aniguiri',
      });
    } catch (e) {
      setAviso({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Erro ao compartilhar.',
      });
    } finally {
      setOcupado(false);
    }
  }

    async function escolherBackup() {
    setAviso(null);
    try {
      const r = await File.pickFileAsync({
        mimeTypes: '*/*', // alguns Androids não reconhecem .json como JSON
      });
      if (r.canceled) return;

      const texto = await r.result.text();
      let json: unknown;
      try {
        json = JSON.parse(texto);
      } catch {
        throw new Error('Este arquivo não é um backup do Aniguiri.');
      }
      setPendente(validarBackup(json)); // abre o diálogo de confirmação
    } catch (e) {
      setAviso({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Erro ao ler o arquivo.',
      });
    }
  }

  async function confirmarImportacao() {
    if (!pendente) return;
    const backup = pendente;
    setPendente(null);
    setOcupado(true);
    try {
      const n = await importarDados(db, backup);
      setAviso({ tipo: 'ok', texto: `${n} anime(s) importado(s).` });
    } catch (e) {
      setAviso({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Erro ao importar.',
      });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Screen title="Ajustes">
      <ScrollView contentContainerStyle={styles.conteudo}>
        {/* Backup */}
        <Text style={styles.secao}>Backup</Text>
                <Text style={styles.descricao}>
          Sua lista fica salva só neste celular. Exporte um backup para guardar, 
          mandar para você mesmo ou levar para outro aparelho.
        </Text>

        {Platform.OS === 'android' && (
          <>
            <Botao
              icone="save-outline"
              texto="Salvar no celular"
              onPress={salvarNoCelular}
              desabilitado={ocupado}
              primario
            />
            <Text style={styles.dica}>
              Escolha ou crie uma pasta, como Download/Aniguiri. O Android não
              permite salvar direto na raiz da pasta Download.
            </Text>
          </>
        )}
        <Botao
          icone="share-outline"
          texto="Compartilhar backup"
          onPress={compartilhar}
          desabilitado={ocupado}
          primario={Platform.OS !== 'android'}
        />

        <Botao
          icone="download-outline"
          texto="Importar backup"
          onPress={escolherBackup}
          desabilitado={ocupado}
        />

        {ocupado && <ActivityIndicator color={colors.primary} />}
        {aviso && (
          <View style={[styles.aviso, aviso.tipo === 'erro' && styles.avisoErro]}>
            <Ionicons
              name={aviso.tipo === 'ok' ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={aviso.tipo === 'ok' ? colors.text : colors.primary}
            />
            <Text style={styles.avisoTexto}>{aviso.texto}</Text>
          </View>
        )}

        {/* Sobre */}
        <Text style={[styles.secao, { marginTop: 16 }]}>Sobre</Text>
        <View style={styles.sobre}>
          <Image
            source={require('../../../assets/images/mascote.png')}
            style={styles.mascote}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.nomeApp}>Aniguiri</Text>
            <Text style={styles.descricao}>Versão {versao}</Text>
          </View>
        </View>

        <Linha
          icone="logo-github"
          texto="Código no GitHub"
          onPress={() => Linking.openURL(GITHUB_URL)}
        />
        <Linha
          icone="globe-outline"
          texto="Dados fornecidos pelo AniList"
          onPress={() => Linking.openURL(ANILIST_URL)}
        />

        <Text style={styles.rodape}>
          O Aniguiri não é afiliado ao AniList. Informações, capas e horários dos
          animes vêm da API pública do AniList.
        </Text>
      </ScrollView>

      <ConfirmDialog
        visivel={pendente !== null}
        titulo="Importar backup"
        mensagem={
          pendente
            ? `Importar ${pendente.animes.length} anime(s)? Nada da sua lista atual será apagado; os animes repetidos ficam com a categoria do backup.`
            : undefined
        }
        textoConfirmar="Importar"
        onConfirmar={confirmarImportacao}
        onCancelar={() => setPendente(null)}
      />
    </Screen>
  );
}

function Botao({
  icone,
  texto,
  onPress,
  desabilitado,
  primario,
}: {
  icone: NomeIcone;
  texto: string;
  onPress: () => void;
  desabilitado?: boolean;
  primario?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      style={({ pressed }) => [
        styles.botao,
        primario ? styles.botaoPrimario : styles.botaoSecundario,
        (pressed || desabilitado) && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icone} size={18} color={colors.text} />
      <Text style={styles.botaoTexto}>{texto}</Text>
    </Pressable>
  );
}

function Linha({
  icone,
  texto,
  onPress,
}: {
  icone: NomeIcone;
  texto: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linha, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icone} size={20} color={colors.muted} />
      <Text style={styles.linhaTexto}>{texto}</Text>
      <Ionicons name="open-outline" size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteudo: { paddingBottom: 32, gap: 12 },
  secao: { color: colors.text, fontSize: 18, fontWeight: '700' },
  descricao: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  dica: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: -4 },

  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  botaoPrimario: { backgroundColor: colors.primary },
  botaoSecundario: { borderWidth: 1, borderColor: colors.border },
  botaoTexto: { color: colors.text, fontSize: 15, fontWeight: '600' },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  avisoErro: { borderColor: colors.primary },
  avisoTexto: { flex: 1, color: colors.text, fontSize: 14 },

  sobre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  mascote: { width: 56, height: 56 },
  nomeApp: { color: colors.text, fontSize: 20, fontWeight: '800' },

  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linhaTexto: { flex: 1, color: colors.text, fontSize: 15 },
  rodape: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
});