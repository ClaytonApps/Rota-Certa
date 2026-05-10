/**
 * Preenchimento por voz (pt-BR) usando Web Speech API.
 *
 * Funciona em Chrome, Edge e navegadores baseados em Chromium (incluindo no
 * Android). No iOS Safari há suporte parcial — recomendamos Chrome.
 *
 * Uso no HTML:
 *   <button type="button" data-voice-target="id_valor_bruto" data-voice-type="number">🎤</button>
 *   <button type="button" data-voice-fill-all>Preencher tudo por voz</button>
 */
(function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SR;

    function setUnsupported() {
        document.querySelectorAll('[data-voice-target], [data-voice-fill-all]')
            .forEach(b => {
                b.disabled = true;
                b.title = 'Reconhecimento de voz não suportado neste navegador. Use Chrome/Edge.';
                b.classList.add('voice-disabled');
            });
    }

    if (!supported) { setUnsupported(); return; }

    /**
     * Normaliza um trecho de fala para um número.
     * Ex.: "duzentos e cinquenta reais" → o navegador costuma devolver "250 reais"
     *      "cento e cinquenta vírgula vinte" → "150,20"
     */
    function parseNumero(text) {
        if (!text) return null;
        let t = text.toLowerCase().trim();
        // Remove unidades monetárias e ruído comum
        t = t.replace(/r\$|reais|real|km|quilômetros?|quilometros?/gi, '');
        // "vírgula" falada -> ","
        t = t.replace(/\bvírgula\b|\bvirgula\b/g, ',');
        // "ponto" entre dígitos -> separador decimal (pt-BR usa vírgula, mas aceitamos)
        t = t.replace(/\bponto\b/g, '.');
        // Mantém apenas dígitos, vírgula, ponto e sinal
        t = t.replace(/[^\d,.-]/g, '').trim();
        if (!t) return null;
        // Padroniza decimal: se tem vírgula, ela é o separador decimal
        if (t.includes(',')) {
            t = t.replace(/\./g, '').replace(',', '.');
        }
        const n = parseFloat(t);
        return isNaN(n) ? null : n;
    }

    /** Hora: "oito horas", "oito e trinta", "08:30", "8 e meia" */
    function parseHora(text) {
        if (!text) return null;
        const t = text.toLowerCase().trim();
        // Formato direto HH:MM
        let m = t.match(/(\d{1,2})[:hH](\d{2})/);
        if (m) return pad(m[1]) + ':' + pad(m[2]);
        // "oito e trinta" / "8 e meia"
        m = t.match(/(\d{1,2})\s*(?:horas?\s*)?(?:e\s+(meia|um quarto|\d{1,2}))?/);
        if (m) {
            const h = parseInt(m[1], 10);
            let min = 0;
            if (m[2] === 'meia') min = 30;
            else if (m[2] === 'um quarto') min = 15;
            else if (m[2]) min = parseInt(m[2], 10) || 0;
            if (h >= 0 && h <= 23 && min >= 0 && min < 60) return pad(h) + ':' + pad(min);
        }
        return null;
    }

    function pad(n) { return String(n).padStart(2, '0'); }

    /** Cria e configura uma nova instância de SpeechRecognition. */
    function novoReconhecimento() {
        const r = new SR();
        r.lang = 'pt-BR';
        r.interimResults = false;
        r.maxAlternatives = 1;
        r.continuous = false;
        return r;
    }

    /**
     * Escuta uma única fala e devolve o texto bruto via Promise.
     * Mostra um overlay simples enquanto escuta.
     */
    function escutar(prompt) {
        return new Promise((resolve, reject) => {
            const r = novoReconhecimento();
            const overlay = mostrarOverlay(prompt || 'Fale agora…');
            let resolved = false;

            r.onresult = (ev) => {
                resolved = true;
                const txt = ev.results[0][0].transcript;
                fecharOverlay(overlay);
                resolve(txt);
            };
            r.onerror = (ev) => {
                fecharOverlay(overlay);
                reject(ev.error);
            };
            r.onend = () => {
                if (!resolved) { fecharOverlay(overlay); resolve(null); }
            };

            try { r.start(); } catch (e) { fecharOverlay(overlay); reject(e); }
        });
    }

    function mostrarOverlay(texto) {
        const div = document.createElement('div');
        div.className = 'voice-overlay';
        div.innerHTML = `
            <div class="voice-overlay-card">
                <div class="voice-pulse"><i class="bi bi-mic-fill"></i></div>
                <div class="voice-text">${texto}</div>
                <button type="button" class="btn btn-sm btn-outline-secondary mt-2 voice-cancel">Cancelar</button>
            </div>`;
        document.body.appendChild(div);
        div.querySelector('.voice-cancel').addEventListener('click', () => fecharOverlay(div));
        return div;
    }

    function fecharOverlay(div) { if (div && div.parentNode) div.parentNode.removeChild(div); }

    function flashCampo(input) {
        input.classList.add('voice-filled');
        setTimeout(() => input.classList.remove('voice-filled'), 1200);
    }

    /** Aplica o resultado da fala em um input com base no tipo. */
    function aplicar(input, texto) {
        if (texto == null) return false;
        const tipo = input.dataset.voiceType || input.type || 'text';
        if (tipo === 'number' || tipo === 'decimal') {
            const n = parseNumero(texto);
            if (n != null) { input.value = n; flashCampo(input); return true; }
        } else if (tipo === 'time') {
            const h = parseHora(texto);
            if (h) { input.value = h; flashCampo(input); return true; }
        } else {
            input.value = texto; flashCampo(input); return true;
        }
        return false;
    }

    /** Botão por campo. */
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-voice-target]');
        if (!btn) return;
        e.preventDefault();
        const input = document.getElementById(btn.dataset.voiceTarget);
        if (!input) return;
        try {
            const txt = await escutar(btn.dataset.voicePrompt || 'Fale o valor…');
            if (!aplicar(input, txt)) {
                alert('Não consegui entender. Tente novamente.');
            }
        } catch (err) {
            console.warn('Voz erro:', err);
            if (err === 'not-allowed') alert('Permissão de microfone negada.');
        }
    });

    /** Modo "preencher tudo": pergunta cada campo sequencialmente. */
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-voice-fill-all]');
        if (!btn) return;
        e.preventDefault();

        const sequencia = [
            { id: 'id_data',         prompt: 'Diga a data (ou pule).',     skip: true },
            { id: 'id_hora_inicio',  prompt: 'Hora de início. Ex: oito horas.' },
            { id: 'id_hora_fim',     prompt: 'Hora de término.' },
            { id: 'id_km_inicial',   prompt: 'KM inicial.' },
            { id: 'id_km_final',     prompt: 'KM final.' },
            { id: 'id_valor_bruto',  prompt: 'Valor bruto em reais.' },
        ];

        for (const passo of sequencia) {
            const input = document.getElementById(passo.id);
            if (!input) continue;
            if (passo.skip && input.value) continue;
            try {
                const txt = await escutar(passo.prompt);
                if (txt) aplicar(input, txt);
                await new Promise(r => setTimeout(r, 400));
            } catch (err) {
                console.warn('Voz erro:', err);
                break;
            }
        }
    });
})();
