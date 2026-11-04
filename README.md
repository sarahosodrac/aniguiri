# Aniguiri 🍙

App Android para organizar animes por temporada e categoria, com agenda de episódios.

## Download

Baixe o APK mais recente em **[Releases](https://github.com/sarahosodrac/aniguiri/releases/latest)**.

### Como instalar
1. Baixe o arquivo `.apk` em **Assets**
2. Abra o arquivo no celular e permita instalar apps desta fonte
3. Se o Play Protect avisar, toque em **Mais detalhes, Instalar mesmo assim**

Para atualizar, basta instalar a versão nova por cima; sua lista é mantida.

## Funcionalidades

- Busca de animes pelo AniList
- Listas por temporada (Inverno, Primavera, Verão, Outono)
- Categorias: Apostas, Chance e Continuação
- Aba Lançamentos com os episódios da semana
- Agenda diária com botão "Visto"
- Detalhes do anime: sinopse, episódios, estúdio, gêneros e nota
- Contador de episódios assistidos
- Backup e importação da lista

## Tecnologias

React Native, Expo, TypeScript e SQLite.

## Rodando o projeto

Requer [Node.js](https://nodejs.org) e o app [Expo Go](https://expo.dev/go) no celular.

```bash
npm install
npx expo start
```

Escaneie o QR code com o Expo Go (PC e celular na mesma rede Wi-Fi).

## Créditos

Dados dos animes fornecidos pela API do [AniList](https://anilist.co).
O Aniguiri não é afiliado ao AniList.

## Observação Importante

Atualmente a aplicação não utiliza nenhum agente, mas mentive no repositório o arquivo `AGENTS.md` e a pasta `.claude/`, que vieram do template da Expo.
Eles contêm instruções para assistentes de programação com IA (como Claude Code, Cursor ou GitHub Copilot).

Se você for contribuir ou adaptar o projeto usando uma dessas ferramentas, elas leem esses arquivos automaticamente, 
então os mantive, mas eles não afetam o app nem fazem parte do APK.
