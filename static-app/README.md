# LucroMetro — versão estática

App 100% no navegador. **Sem servidor, sem instalação, sem login.**
Os dados ficam no `localStorage` do dispositivo.

## Como usar

### Opção A — Abrir direto no PC
1. Dê duplo clique em `index.html` (abre no navegador padrão)
2. Pronto. Funciona offline depois do primeiro carregamento.

> **Observação:** o ditado por voz exige Chrome ou Edge e permissão de
> microfone. Em `file://` o navegador pode bloquear — se isso acontecer,
> use a opção B.

### Opção B — Servidor local rápido (1 comando)
```powershell
cd "C:\Users\clayt\Downloads\Rota Certa\static-app"
python -m http.server 8080
```
Acesse `http://localhost:8080`.

### Opção C — Hospedar grátis online
Faça upload da pasta `static-app/` em qualquer um:

| Serviço          | Custo  | HTTPS | Drag-and-drop |
|------------------|--------|-------|----------------|
| **Netlify Drop** | Grátis | ✅    | ✅ (mais fácil) |
| **GitHub Pages** | Grátis | ✅    | via repositório |
| **Vercel**       | Grátis | ✅    | via CLI/repo   |
| **Cloudflare Pages** | Grátis | ✅ | via repositório |

> Voz só funciona em `https://` (ou `localhost`). Por isso recomendamos
> hospedar em vez de abrir como `file://` se for usar no celular.

### Instalar como app no celular (PWA)
1. Abra a URL no Chrome do Android
2. Menu → "Adicionar à tela inicial"
3. O app abre em tela cheia, com ícone próprio, funciona offline

## Funcionalidades

- ✅ Dashboard com lucro total, médias R$/km e R$/hora, totais
- ✅ Filtros de período: hoje, 7 dias, 30 dias, tudo
- ✅ CRUD completo de jornadas (criar, listar, editar, excluir)
- ✅ Cálculos automáticos (KM, horas, R$/km, R$/h) inclusive em jornadas que cruzam meia-noite
- ✅ Preenchimento por voz (campos individuais ou todos em sequência)
- ✅ Design responsivo (mobile + desktop)
- ✅ Exportar / importar JSON (backup)
- ✅ PWA — instalável e offline
- ✅ 6 jornadas de exemplo na primeira abertura

## Estrutura

```
static-app/
├── index.html       # única página, hash router (#/, #/nova, etc.)
├── app.js           # lógica, persistência, cálculos, render
├── voice.js         # Web Speech API (reaproveitado da versão Django)
├── app.css          # design azul + verde (reaproveitado)
└── manifest.json    # config PWA
```

## Importante: backup dos dados

Como tudo fica no `localStorage`:
- **Se limpar dados do navegador → perde tudo**
- Use o botão **"Exportar"** periodicamente para baixar um JSON
- Em outro dispositivo (ou após reinstalar), use **"Importar"** para restaurar
