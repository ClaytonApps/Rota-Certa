# 🚗 Rota Certa

> **Calculadora de rentabilidade para motoristas.**
> Saiba quanto você realmente lucra em cada jornada — R$ por hora, R$ por km e o lucro total.

Funciona **100% no celular**, **offline**, **sem cadastro** e **sem rastreio**. Os dados ficam apenas no seu dispositivo.

---

## ✨ Recursos

- 📊 **Dashboard** com lucro total, médias R$/hora e R$/km, totais de horas e km
- ▶️ **Jornada em andamento** — registre a hora de início e o KM ao começar; finalize quando parar de trabalhar
- 🎤 **Preenchimento por voz** em pt-BR (Web Speech API) — dite hora, KM ou valor sem digitar dirigindo
- 🗓️ **Filtros de período** — hoje, 7 dias, 30 dias, tudo
- 📱 **Instalável como app (PWA)** — abre em tela cheia, com ícone próprio, funciona offline
- 💾 **Exportar / importar JSON** para backup
- 🎨 **Design responsivo** — mobile e desktop
- 🔒 **Privado por design** — nada vai pra nuvem

---

## 🚀 Versões disponíveis

Este repositório contém **três variantes** do mesmo app — escolha a que servir melhor:

| Variante | Onde fica | Para quê |
|----------|-----------|----------|
| **Landing page** | [`index.html`](index.html) | Página de demonstração / home do projeto |
| **App standalone** | [`app.html`](app.html) | Arquivo único; abre com duplo clique |
| **PWA instalável** | [`./`](./) | Versão para instalar no celular como aplicativo |
| **Versão Django (full-stack)** | [`rota_certa/`](rota_certa/), [`jornadas/`](jornadas/) | Backend completo com admin, signals e Firebase stub |

---

## 📦 Como usar

### Online (recomendado)

Hospedado em GitHub Pages: `https://SEU-USUARIO.github.io/rota-certa/`

- Landing → raiz
- App → `/app.html`
- PWA → `/./`

### Localmente, sem servidor

Duplo clique em `app.html` (ou `index.html` para a landing). Funciona direto.

> ℹ️ Voz e instalação como PWA exigem HTTPS — em `file://` o navegador bloqueia. Para testar essas features localmente, sirva via servidor (próxima seção).

### Localmente, com servidor

```powershell
cd "Rota Certa"
python -m http.server 8000
```

Abra <http://localhost:8000>. Chrome considera `localhost` seguro, então tudo funciona.

### Versão Django

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

---

## 📲 Instalando como app no celular

1. Suba o repositório no GitHub Pages (instruções abaixo)
2. No Chrome do Android, abra a URL `https://SEU-USUARIO.github.io/rota-certa/./`
3. Menu ⋮ → **"Instalar app"** ou **"Adicionar à tela inicial"**
4. O app vira um ícone na tela inicial, abre em tela cheia, e funciona offline

Veja [`./COMO-INSTALAR.md`](./COMO-INSTALAR.md) para detalhes (incluindo iOS).

---

## 🛠️ Stack

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Bibliotecas externas (CDN):** Bootstrap 5.3, Bootstrap Icons, Inter (Google Fonts)
- **Persistência:** `localStorage` (versão estática) ou SQLite (Django)
- **PWA:** Service Worker com cache-first / stale-while-revalidate
- **Voz:** Web Speech API (`SpeechRecognition`)
- **Backend opcional:** Django 5 + Python 3.11+

---

## 🎨 Paleta

| Cor              | Hex       | Uso                         |
|------------------|-----------|------------------------------|
| Azul escuro      | `#0f1e3a` | Header, primária             |
| Cinza escuro     | `#1f2937` | Secundária / gradientes      |
| Verde            | `#10b981` | Acento / sucesso / CTAs      |

---

## 💚 Apoie o projeto

O Rota Certa é gratuito e sem anúncios. Se ele te ajudou, considere apoiar:

[**Apoiar via Mercado Pago →**](https://mpago.la/2z5Uj6E)

---

## 📄 Licença

MIT — use, modifique, distribua. Veja [LICENSE](LICENSE).

---

<p align="center">
    Feito com ❤️ para quem está na rua.
</p>
