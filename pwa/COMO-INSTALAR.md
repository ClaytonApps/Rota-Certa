# Rota Certa — instalação como app no celular (PWA)

Esta pasta tem tudo que o navegador precisa para mostrar o botão **"Instalar app"** no celular: HTML, manifest, service worker e ícones.

## Pré-requisito

PWAs **só são instaláveis em HTTPS** (ou em `localhost` para testes). Você precisa hospedar a pasta em algum lugar com HTTPS.

## Opção 1 — Netlify Drop (mais rápido, ~30 segundos)

1. Acesse https://app.netlify.com/drop
2. **Arraste a pasta `RotaCerta-PWA` inteira** para a área indicada
3. O Netlify gera uma URL como `https://nome-aleatorio.netlify.app`
4. Abra essa URL no Chrome do celular
5. Toque no menu (⋮) → **"Instalar app"** ou **"Adicionar à tela inicial"**

Não precisa criar conta. URL fica online indefinidamente.

## Opção 2 — GitHub Pages (grátis, com domínio próprio possível)

1. Crie um repositório no GitHub
2. Faça upload dos 7 arquivos desta pasta
3. Em **Settings → Pages**, ative o GitHub Pages no branch `main`
4. URL será `https://seu-usuario.github.io/nome-do-repo/`

## Opção 3 — Teste local antes de hospedar

```powershell
cd "C:\Users\clayt\Downloads\Rota Certa\RotaCerta-PWA"
python -m http.server 8000
```

Abra `http://localhost:8000` no Chrome do PC. O Chrome considera `localhost` seguro, então o botão "Instalar" aparece na barra de endereços (ícone com ⊕). Os dados ficam separados da versão online.

## Como instalar no celular

### Android (Chrome)
1. Abra a URL HTTPS no Chrome
2. Aparecerá um banner "Instalar Rota Certa" no rodapé
3. Ou: menu ⋮ → **"Instalar app"** / **"Adicionar à tela inicial"**
4. O app vira um ícone na tela inicial; abre em tela cheia, sem barra do navegador

### iOS (Safari)
1. Abra a URL no Safari (Chrome iOS não suporta instalar PWA)
2. Toque no botão Compartilhar (□↑)
3. Role e toque em **"Adicionar à Tela de Início"**
4. iOS tem suporte parcial: voz pode falhar, mas dashboard, formulário e cálculos funcionam

## O que o app faz quando instalado

- Abre em tela cheia, com ícone próprio (azul-escuro com ‘RC’)
- **Funciona offline** após a primeira abertura (service worker cacheia tudo, inclusive Bootstrap/fontes)
- Atalhos rápidos no menu de longo-toque do ícone: "Nova jornada" e "Histórico"
- Dados salvos no dispositivo (`localStorage`) — mesmo offline, registrar e finalizar jornadas funciona

## Atualizando o app

Trocou algo no `index.html`?

1. Edite o `CACHE_NAME` em `sw.js` (de `rota-certa-v2` para `rota-certa-v3`)
2. Faça novo upload (ou commit) — na próxima abertura o navegador detecta a versão nova e atualiza o cache automaticamente

## Backup

Use **Exportar / Importar** dentro do app — os dados ficam só no celular, então faça backup periódico do JSON.

---

## Arquivos desta pasta

```
RotaCerta-PWA/
├── index.html             ← o app (HTML+CSS+JS embutido)
├── manifest.webmanifest   ← metadados PWA (nome, ícones, atalhos)
├── sw.js                  ← service worker (cache offline)
├── icon.svg               ← ícone vetorial (favicon do navegador)
├── icon-192.png           ← ícone Android pequeno
├── icon-512.png           ← ícone Android splash screen
└── icon-maskable.png      ← ícone Android adaptativo (recortado em qualquer formato)
```
