# Painel Google Sheets estatico

Este exemplo abre direto pelo `index.html`, sem instalar dependencias.

## Como testar

1. Abra a pasta `sheets-dashboard-static` no VS Code.
2. Abra `index.html` no navegador.
3. Use o botao `Configurar` para informar o link da sua planilha.

## Como conectar no Google Sheets

### Opcao com OAuth

Use esta opcao quando a planilha for restrita/confidencial.

1. No Google Cloud, ative a `Google Sheets API` no projeto.
2. Em `Google Auth platform`, configure a tela de consentimento.
3. Crie ou edite um OAuth Client do tipo `Web application`.
4. Em `Authorized JavaScript origins`, adicione:
   - `http://127.0.0.1:5500`
   - `http://localhost:5500`
5. Nao use `client_secret` no navegador. Este app usa somente o `client_id`.
6. Abra o site por `http://127.0.0.1:5500`, clique em `Entrar Google` e autorize o acesso de leitura.

O escopo usado e somente leitura:

```txt
https://www.googleapis.com/auth/spreadsheets.readonly
```

### Opcao publica

Tambem funciona publicar a planilha como CSV, mas isso deixa a aba acessivel por link.

1. No Google Sheets, clique em `Arquivo > Compartilhar > Publicar na Web`.
2. Escolha a aba desejada.
3. Publique como CSV.
4. Cole o link publicado no campo de configuracao do site.

## Onde mudar a planilha direto no codigo

Abra `app.js` e edite:

```js
const GOOGLE_SHEET = {
  source: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=0&single=true&output=csv",
  gid: "0",
  sheetName: "Maker",
  refreshMinutes: 0,
  clientId: "1090675917747-smvgs24cgi6n5qt6sv816khti52fvjsj.apps.googleusercontent.com"
};
```

Use `source` com o link publicado, link normal da planilha ou ID.
Use `sheetName` quando quiser carregar pelo nome da aba. Use `gid` quando preferir carregar pelo numero da aba. Se os dois estiverem preenchidos, o `gid` tem prioridade.
Use `clientId` com o OAuth Client ID do tipo Web. Nunca coloque o `client_secret` aqui.

Para atualizar sozinho, coloque `refreshMinutes` acima de `0`, por exemplo `5` para recarregar a planilha a cada cinco minutos.

## Observacao importante

OAuth nao funciona de forma confiavel abrindo `file://`. Rode um servidor local, por exemplo:

```powershell
cd "C:\Users\matheus.carvalho\Documents\New project\sheets-dashboard-static"
python -m http.server 5500 --bind 127.0.0.1
```

Depois abra `http://127.0.0.1:5500`.

## Escrita no Google Sheets

O painel ja esta preparado para enviar edicoes para o Apps Script:

```txt
https://script.google.com/macros/s/AKfycbw-tLruP64EXOMQ0_OgAXy1mn4MRwNIOy3CZTdUvVwmrJQodW5kX0C-9XkMFKC2nG5KRw/exec
```

Para ativar:

1. Abra `Configurar`.
2. Confira o campo `Apps Script URL`.
3. Preencha `Token de escrita` com o mesmo `SECRET` configurado no Apps Script.
4. Clique em `Carregar`.

Quando alterar um campo editavel, o site salva localmente e envia para o Apps Script usando `ID_ALIANCA`, nome da coluna e novo valor. Isso vale para status e tambem para campos de texto editaveis como `Valor Final`, `Emissao`, `Envio`, `Previsao PGT`, `Link`, `Comprovante Link` e `Obs`.

Como o Apps Script nao devolve CORS de forma confiavel para site estatico, o painel mostra `Enviado ao Sheets, atualize para confirmar`; depois clique em atualizar para recarregar o CSV publicado.

## Criacao de NDs

A pagina `nd.html` monta uma fila de NDs usando a aba `Maker` e o historico publicado no `gid=1349527717`.

Regras principais:

- entra na fila quando `Status Catman` estiver como `Valido`; valores antigos `Approved`/`Aprovado` tambem sao aceitos para transicao.
- a primeira ND nova e `358`, ou o proximo numero depois do maior `N_ND` ja existente no historico.
- a pagina compara `ID_ALIANCA`, maker, ano e valor para evitar criar copia quando o botao for clicado de novo.
- a criacao real no Sheets/Drive precisa do Apps Script do arquivo `APPS_SCRIPT_ND_WEBAPP.gs`.

Para ativar a criacao:

1. Cole o conteudo de `APPS_SCRIPT_ND_WEBAPP.gs` em um projeto Apps Script.
2. Em `Project Settings > Script properties`, crie a propriedade `SECRET`.
3. Publique como Web App.
4. Abra `nd.html`, preencha `Apps Script URL` e `Token de escrita`, salve e clique em `Criar NDs`.

## Filtros extras

O painel reconhece a coluna `ANO` automaticamente e cria o filtro `Ano`.

O filtro da coluna `CATMAN` usa as opcoes encontradas na aba `filters`, coluna `CATMAN`/K. O link publicado dessa aba esta configurado com `gid=1292236262`. Se a aba `filters` nao carregar, o painel usa os valores de `CATMAN` que ja existem na aba principal.

As opcoes de `Status Catman` agora sao fixas: `Valido` e `Aguardando Validacao`. As opcoes de `Status FP&A` vem da aba `filters`, coluna C. Se essa lista nao carregar, o painel usa os status ja presentes na base e uma lista padrao.
