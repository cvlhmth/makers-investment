# Makers Investment - documentacao do site

Este documento explica como o site funciona, como publicar no GitHub Pages e como fazer novas alteracoes depois.

## 1. O que este projeto e

Este site e um painel estatico em HTML, CSS e JavaScript. Ele nao precisa de servidor proprio para abrir a tela.

Arquivos principais:

```txt
index.html       Estrutura da pagina
styles.css       Visual, layout, cores, tabela e responsividade
app.js           Logica do dashboard, filtros, leitura do Sheets e edicoes
rappi-logo.png   Logo usada no topo
README.md        Resumo tecnico
DOCUMENTACAO.md  Este guia
```

## 2. Como o site funciona

O site abre o `index.html` e o JavaScript em `app.js` busca os dados direto do Google Sheets.

Hoje existem duas fontes principais:

```txt
Aba Maker
https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=0&single=true&output=csv

Aba filters
https://docs.google.com/spreadsheets/d/e/2PACX-1vTS6O5KqvPstUqKBvqorDRMryNJKa6rbPLCy5CRVMz8kSlS7gyxZubKqLxrUqW4sYenWTYZFUUv-1L-/pub?gid=1292236262&single=true&output=csv
```

A aba `Maker` alimenta a tabela principal.

A aba `filters` alimenta listas de opcoes, como `CATMAN`, `Status Catman` e `Status FP&A`.

## 3. O que precisa publicar e o que nao precisa

Quando voce muda o visual ou codigo do site, precisa publicar de novo:

```txt
index.html
styles.css
app.js
rappi-logo.png
README.md
DOCUMENTACAO.md
```

Quando voce muda apenas dados na planilha Google Sheets, nao precisa publicar de novo. O site busca os dados da planilha.

Exemplos que precisam de `git push`:

```txt
Trocar layout
Mudar cor
Adicionar texto na header
Fixar coluna
Alterar regra de filtro
Alterar logica de edicao
Trocar logo
```

Exemplos que nao precisam de `git push`:

```txt
Adicionar linhas na planilha
Mudar status na planilha
Atualizar valores na planilha
Alterar opcoes na aba filters
```

## 4. Como testar localmente

Voce pode abrir direto:

```txt
C:\Users\matheus.carvalho\Documents\New project\sheets-dashboard-static\index.html
```

Ou clicar duas vezes no `index.html`.

Se a tela mostrar algo como:

```txt
Conectado ao Google Sheets (aba Maker), 247 registros
```

entao a leitura da planilha funcionou.

## 5. Como publicar pela primeira vez no GitHub Pages

Abra a pasta certa no VS Code:

```txt
C:\Users\matheus.carvalho\Documents\New project\sheets-dashboard-static
```

No terminal:

```bash
git init
git add index.html styles.css app.js rappi-logo.png README.md DOCUMENTACAO.md
git commit -m "Publica Makers Investment"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/makers-investment.git
git push -u origin main
```

Depois, no GitHub:

```txt
Repository > Settings > Pages
Source: Deploy from a branch
Branch: main
Folder: /root
Save
```

O link fica parecido com:

```txt
https://SEU-USUARIO.github.io/makers-investment/
```

## 6. Como publicar uma alteracao depois

Depois de alterar qualquer arquivo do site, rode:

```bash
git status
git add index.html styles.css app.js rappi-logo.png README.md DOCUMENTACAO.md
git commit -m "Descreva a alteracao"
git push
```

Exemplo:

```bash
git add index.html styles.css
git commit -m "Fixa colunas ID e Maker na tabela"
git push
```

O GitHub Pages atualiza automaticamente depois do `git push`.

Normalmente demora de 1 a 3 minutos.

## 7. Como saber se publicou

Depois do push:

```txt
GitHub > Repository > Actions
```

Veja se o deploy terminou verde.

Depois abra:

```txt
https://SEU-USUARIO.github.io/makers-investment/
```

Use Ctrl + F5 no navegador se parecer que ainda esta carregando versao antiga.

## 8. Como funciona a edicao no Google Sheets

O site esta preparado para enviar alteracoes para um Apps Script.

Endpoint configurado hoje:

```txt
https://script.google.com/macros/s/AKfycbw-tLruP64EXOMQ0_OgAXy1mn4MRwNIOy3CZTdUvVwmrJQodW5kX0C-9XkMFKC2nG5KRw/exec
```

Quando alguem altera um campo editavel no site, o fluxo e:

```txt
Usuario altera campo no site
app.js salva a edicao localmente
app.js envia para o Apps Script
Apps Script atualiza a planilha
Usuario atualiza o dashboard para confirmar
```

Importante: por causa de limitacoes de CORS do Apps Script, o site pode mostrar:

```txt
Enviado ao Sheets, atualize para confirmar
```

Isso significa que a chamada foi enviada, mas o navegador nao consegue ler a resposta completa do Apps Script.

## 9. Token de escrita

O codigo tem suporte para `Token de escrita`.

Se o token estiver vazio, o site pode mostrar:

```txt
Informe o token para salvar no Sheets
```

Esse token serve para evitar que qualquer pessoa envie alteracoes para a planilha.

Atencao: nunca coloque `client_secret` do Google OAuth no frontend. Tudo que esta em `index.html`, `styles.css` e `app.js` fica visivel para quem acessa o site.

O `client_id` pode ficar no frontend. O `client_secret` nao.

## 10. Como mudar os dados usados pelo site

As configuracoes principais ficam no topo do `app.js`:

```js
const GOOGLE_SHEET = {
  source: "...link CSV da aba Maker...",
  gid: "0",
  sheetName: "Maker",
  refreshMinutes: 0,
  clientId: "...apps.googleusercontent.com",
  writeEndpoint: "...Apps Script URL...",
  writeSecret: "",
  filtersSource: "...link CSV da aba filters...",
  filtersSheetName: "filters"
};
```

Se trocar a planilha:

```txt
1. Publique a nova aba como CSV
2. Copie o link
3. Troque `source` no app.js
4. Se tiver nova aba filters, troque `filtersSource`
5. Salve
6. git add app.js
7. git commit
8. git push
```

## 11. Como alterar visual

Altere `styles.css`.

Exemplos comuns:

```txt
Header, logo, cores: procure por report-hero, rappi-logo, hero-title
Cards de metricas: procure por metric ou metrics-grid
Filtros: procure por toolbar
Tabela: procure por table-wrap, th, td, column-row
Colunas fixas: procure por nth-child(1) e nth-child(2)
```

Depois:

```bash
git add styles.css
git commit -m "Atualiza visual"
git push
```

## 12. Como alterar textos fixos

Altere `index.html`.

Exemplos:

```txt
Titulo: Makers Investment
Subtitulo: Plano query vs execucao comercial - base Google Sheets
Linha Slack: Slack: @matheus.carvalho @rita.kamensky
Botao Configurar
Labels dos campos de configuracao
```

Depois:

```bash
git add index.html
git commit -m "Atualiza textos"
git push
```

## 13. Como alterar filtros e opcoes

Alguns filtros vem da planilha.

Na aba `filters`:

```txt
Coluna A: Catman
Coluna B: Status Catman
Coluna C: Status FP&A
```

Quando mudar esses valores na planilha publicada, o site deve carregar as novas opcoes ao atualizar a pagina.

## 14. Problemas comuns

### O site nao atualizou depois do push

Espere alguns minutos e use:

```txt
Ctrl + F5
```

Tambem confira:

```txt
GitHub > Actions
```

### Erro 404 no GitHub Pages

Verifique:

```txt
Settings > Pages
Branch: main
Folder: /root
```

### Aparece conta GitHub suspensa no push

Apague credenciais antigas:

```powershell
cmdkey /delete:git:https://github.com
```

Depois remova tambem pelo Windows:

```txt
Gerenciador de Credenciais > Credenciais do Windows > remover github.com
```

### A planilha nao carrega

Confira se o link CSV publicado ainda abre no navegador.

Se a planilha deixou de estar publicada, o site nao consegue ler.

### A edicao nao salva no Sheets

Confira:

```txt
Apps Script publicado como Web App
URL /exec correta no app.js
Token de escrita correto
Permissao do Web App correta
```

## 15. Checklist antes de publicar

Antes de dar `git push`, confira:

```txt
index.html atualizado
styles.css atualizado
app.js atualizado se mudou logica
rappi-logo.png existe
Nao subir arquivos temporarios
Nao subir client_secret
git status revisado
```

Comandos finais:

```bash
git status
git add index.html styles.css app.js rappi-logo.png README.md DOCUMENTACAO.md
git commit -m "Atualiza dashboard"
git push
```
