/**
 * LucroMetro — versão estática (sem servidor).
 *
 * Persistência: localStorage.
 * Roteamento: hash router (#/, #/historico, #/nova, #/editar/:id, #/excluir/:id).
 * Cálculos: porte direto de jornadas/utils.py.
 */
(function () {
'use strict';

// ─── Persistência ─────────────────────────────────────────────
const KEY = 'lucrometro:jornadas:v1';

function load() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
function nextId(list) { return list.reduce((m, j) => Math.max(m, j.id || 0), 0) + 1; }

// ─── Cálculos (porte de utils.py) ─────────────────────────────
function q2(n) { return Math.round((+n || 0) * 100) / 100; }

function totalKm(ki, kf) {
    const d = (+kf) - (+ki);
    return q2(d > 0 ? d : 0);
}
function totalHoras(hi, hf) {
    if (!hi || !hf) return 0;
    const [h1, m1] = hi.split(':').map(Number);
    const [h2, m2] = hf.split(':').map(Number);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins <= 0) mins += 24 * 60;  // cruzou meia-noite
    return q2(mins / 60);
}
function precoPorKm(valor, km) {
    return km > 0 ? q2(valor / km) : 0;
}
function precoPorHora(valor, horas) {
    return horas > 0 ? q2(valor / horas) : 0;
}
function formatarHorasDecimais(h) {
    const inteiro = Math.floor(h);
    const min = Math.round((h - inteiro) * 60);
    return `${inteiro}h ${String(min).padStart(2, '0')}min`;
}

function enriquecer(j) {
    const total_km = totalKm(j.km_inicial, j.km_final);
    const total_horas = totalHoras(j.hora_inicio, j.hora_fim);
    return {
        ...j,
        total_km,
        total_horas,
        preco_por_km: precoPorKm(+j.valor_bruto, total_km),
        preco_por_hora: precoPorHora(+j.valor_bruto, total_horas),
        total_horas_formatado: formatarHorasDecimais(total_horas),
    };
}

function resumoDashboard(jornadas) {
    let bruto = 0, km = 0, horas = 0;
    for (const j of jornadas) {
        bruto += +j.valor_bruto || 0;
        km    += +j.total_km    || 0;
        horas += +j.total_horas || 0;
    }
    return {
        total_jornadas: jornadas.length,
        total_bruto: q2(bruto),
        total_km: q2(km),
        total_horas: q2(horas),
        media_por_km:   precoPorKm(bruto, km),
        media_por_hora: precoPorHora(bruto, horas),
    };
}

// ─── Filtros de período ───────────────────────────────────────
const PERIODOS = { hoje: 'Hoje', semana: 'Últimos 7 dias', mes: 'Últimos 30 dias', tudo: 'Tudo' };

function filtrarPeriodo(list, periodo) {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    function dias(n) { const d = new Date(hoje); d.setDate(d.getDate() - n); return d; }
    return list.filter(j => {
        if (periodo === 'tudo') return true;
        const d = new Date(j.data + 'T00:00:00');
        if (periodo === 'hoje')   return d.getTime() === hoje.getTime();
        if (periodo === 'semana') return d >= dias(6);
        if (periodo === 'mes')    return d >= dias(29);
        return true;
    });
}

// ─── Helpers de formatação ────────────────────────────────────
function fmtBR(n) { return (+n).toFixed(2).replace('.', ','); }
function fmtData(s) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
}
function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Alertas (toasts) ─────────────────────────────────────────
function alerta(msg, tipo='success') {
    const el = document.createElement('div');
    el.className = `alert alert-${tipo} alert-dismissible fade show`;
    el.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>${escapeHtml(msg)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.getElementById('alerts').appendChild(el);
    setTimeout(() => el.classList.remove('show'), 3000);
    setTimeout(() => el.remove(), 3500);
}

// ─── Roteamento ───────────────────────────────────────────────
function parseHash() {
    const h = location.hash.replace(/^#/, '') || '/';
    const parts = h.split('/').filter(Boolean);
    return { route: parts[0] || 'dashboard', param: parts[1] };
}

function setActiveLinks(route) {
    document.querySelectorAll('[data-route]').forEach(a => {
        a.classList.toggle('active', a.dataset.route === route);
    });
}

function render() {
    const { route, param } = parseHash();
    const jornadas = load().map(enriquecer);
    const view = document.getElementById('view');
    const action = document.getElementById('topbar-action');
    action.innerHTML = '';

    if (!route || route === '' || (route === 'dashboard' && !param)) {
        renderDashboard(view, action, jornadas);
        setActiveLinks('dashboard');
    } else if (route === 'historico') {
        renderHistorico(view, action, jornadas);
        setActiveLinks('historico');
    } else if (route === 'nova') {
        renderForm(view, action, null);
        setActiveLinks('nova');
    } else if (route === 'editar' && param) {
        const j = jornadas.find(x => x.id == param);
        if (!j) { location.hash = '#/historico'; return; }
        renderForm(view, action, j);
        setActiveLinks('historico');
    } else if (route === 'excluir' && param) {
        const j = jornadas.find(x => x.id == param);
        if (!j) { location.hash = '#/historico'; return; }
        renderExcluir(view, j);
        setActiveLinks('historico');
    } else {
        location.hash = '#/';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
}

window.addEventListener('hashchange', render);

// ─── Views ────────────────────────────────────────────────────
function renderDashboard(view, action, jornadas) {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    let periodo = params.get('periodo') || 'mes';
    if (!PERIODOS[periodo]) periodo = 'mes';

    const filtradas = filtrarPeriodo(jornadas, periodo)
        .sort((a, b) => (b.data + b.hora_inicio).localeCompare(a.data + a.hora_inicio));
    const r = resumoDashboard(filtradas);
    const ultimas = filtradas.slice(0, 6);

    action.innerHTML = `<a href="#/nova" class="fab-add"><i class="bi bi-plus-lg"></i> Nova jornada</a>`;

    view.innerHTML = `
        <div class="period-filter">
            ${Object.entries(PERIODOS).map(([k, l]) => `
                <a href="#/?periodo=${k}" class="chip ${periodo === k ? 'active' : ''}">${l}</a>
            `).join('')}
        </div>

        <div class="hero-card mb-3 mb-lg-4">
            <div>
                <div class="label">Lucro total</div>
                <div class="value text-money">R$ ${fmtBR(r.total_bruto)}</div>
                <div class="meta">
                    <i class="bi bi-receipt"></i>
                    ${r.total_jornadas} jornada${r.total_jornadas !== 1 ? 's' : ''} no período
                </div>
            </div>
            <div class="hero-card-cta d-none d-lg-block">
                <a href="#/nova" class="btn btn-light btn-lg fw-bold" style="color: var(--primary);">
                    <i class="bi bi-plus-lg"></i> Registrar jornada
                </a>
            </div>
        </div>

        <div class="row g-2 g-lg-3 mb-2">
            <div class="col-6 col-lg-3">
                <div class="card metric-card accent">
                    <div class="icon-pill"><i class="bi bi-clock-fill"></i></div>
                    <div class="label">Média R$/hora</div>
                    <div class="value text-money">R$ ${fmtBR(r.media_por_hora)}</div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="card metric-card accent">
                    <div class="icon-pill"><i class="bi bi-fuel-pump-fill"></i></div>
                    <div class="label">Média R$/km</div>
                    <div class="value text-money">R$ ${fmtBR(r.media_por_km)}</div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="card metric-card primary">
                    <div class="icon-pill"><i class="bi bi-signpost-split-fill"></i></div>
                    <div class="label">Total km</div>
                    <div class="value text-money">${fmtBR(r.total_km)}</div>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="card metric-card primary">
                    <div class="icon-pill"><i class="bi bi-hourglass-split"></i></div>
                    <div class="label">Total horas</div>
                    <div class="value text-money">${fmtBR(r.total_horas)}</div>
                </div>
            </div>
        </div>

        <div class="section-title">
            <span>Últimas jornadas</span>
            <a href="#/historico" class="text-decoration-none small fw-semibold" style="color: var(--primary);">
                Ver tudo <i class="bi bi-arrow-right"></i>
            </a>
        </div>

        ${ultimas.length ? `
            <div class="journey-list grid">
                ${ultimas.map(j => journeyCard(j, true)).join('')}
            </div>` : `
            <div class="empty-state">
                <div class="empty-icon"><i class="bi bi-inbox"></i></div>
                <p class="mb-3">Nenhuma jornada no período selecionado.</p>
                <a href="#/nova" class="btn btn-primary">
                    <i class="bi bi-plus-lg"></i> Registrar jornada
                </a>
            </div>`}
    `;
}

function journeyCard(j, clickable) {
    const inner = `
        <div class="row-top">
            <span class="date"><i class="bi bi-calendar3"></i>${fmtData(j.data)}</span>
            <span class="amount text-money">R$ ${fmtBR(j.valor_bruto)}</span>
        </div>
        <div class="stats">
            <span><i class="bi bi-signpost"></i> ${fmtBR(j.total_km)} km</span>
            <span><i class="bi bi-clock"></i> ${j.total_horas_formatado}</span>
            <span><i class="bi bi-fuel-pump"></i> R$ ${fmtBR(j.preco_por_km)}/km</span>
            <span><i class="bi bi-cash-coin"></i> R$ ${fmtBR(j.preco_por_hora)}/h</span>
        </div>`;
    return clickable
        ? `<a href="#/editar/${j.id}" class="journey-item">${inner}</a>`
        : `<div class="journey-item" style="cursor:default;">${inner}</div>`;
}

function renderHistorico(view, action, jornadas) {
    action.innerHTML = `<a href="#/nova" class="fab-add"><i class="bi bi-plus-lg"></i> Nova jornada</a>`;
    const sorted = jornadas.sort((a, b) => (b.data + b.hora_inicio).localeCompare(a.data + a.hora_inicio));
    view.innerHTML = `
        <div class="section-title">
            <span>Todas as jornadas</span>
            <span class="badge rounded-pill" style="background: var(--gradient-primary);">${sorted.length}</span>
        </div>
        ${sorted.length ? `
            <div class="journey-list grid">
                ${sorted.map(j => `
                    <div class="journey-item" style="cursor: default;">
                        <div class="row-top">
                            <span class="date"><i class="bi bi-calendar3"></i>${fmtData(j.data)}</span>
                            <span class="amount text-money">R$ ${fmtBR(j.valor_bruto)}</span>
                        </div>
                        <div class="stats mb-2">
                            <span><i class="bi bi-clock"></i> ${j.hora_inicio} – ${j.hora_fim}</span>
                            <span><i class="bi bi-hourglass"></i> ${j.total_horas_formatado}</span>
                            <span><i class="bi bi-signpost"></i> ${fmtBR(j.total_km)} km</span>
                            <span><i class="bi bi-fuel-pump"></i> R$ ${fmtBR(j.preco_por_km)}/km</span>
                            <span style="grid-column: span 2;"><i class="bi bi-cash-coin"></i> R$ ${fmtBR(j.preco_por_hora)}/h</span>
                        </div>
                        <div class="d-flex gap-2 mt-2">
                            <a href="#/editar/${j.id}" class="btn btn-sm btn-outline-primary flex-fill">
                                <i class="bi bi-pencil"></i> Editar
                            </a>
                            <a href="#/excluir/${j.id}" class="btn btn-sm btn-outline-danger flex-fill">
                                <i class="bi bi-trash"></i> Excluir
                            </a>
                        </div>
                    </div>`).join('')}
            </div>` : `
            <div class="empty-state">
                <div class="empty-icon"><i class="bi bi-inbox"></i></div>
                <p class="mb-3">Nenhuma jornada registrada ainda.</p>
                <a href="#/nova" class="btn btn-primary">
                    <i class="bi bi-plus-lg"></i> Registrar a primeira
                </a>
            </div>`}
    `;
}

function renderForm(view, action, jornada) {
    const editando = !!jornada;
    const j = jornada || { data: todayISO(), hora_inicio: '', hora_fim: '', km_inicial: '', km_final: '', valor_bruto: '' };

    view.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-lg-10 col-xl-8">
                <div class="section-title">
                    <span>${editando ? 'Editar jornada' : 'Registrar nova jornada'}</span>
                </div>
                <button type="button" class="btn-voice-all mb-3" data-voice-fill-all>
                    <i class="bi bi-mic-fill"></i> Preencher tudo por voz
                </button>
                <div class="card p-3 p-md-4 p-lg-5">
                    <form id="form-jornada">
                        <div class="form-desktop-grid">
                            <div class="mb-3 form-full">
                                <label for="id_data" class="form-label"><i class="bi bi-calendar3"></i> Data</label>
                                <input type="date" id="id_data" name="data" class="form-control form-control-lg" required value="${j.data}">
                            </div>
                            ${campoTime('hora_inicio', 'Início', 'play-circle', j.hora_inicio, 'Hora de início. Ex: oito horas.')}
                            ${campoTime('hora_fim', 'Término', 'stop-circle', j.hora_fim, 'Hora de término.')}
                            ${campoNumero('km_inicial', 'KM inicial', 'signpost', j.km_inicial, '0.1', 'KM inicial.')}
                            ${campoNumero('km_final', 'KM final', 'signpost-fill', j.km_final, '0.1', 'KM final.')}
                            <div class="mb-4 form-full">
                                <label for="id_valor_bruto" class="form-label"><i class="bi bi-cash-coin"></i> Valor bruto (R$)</label>
                                <div class="input-with-mic">
                                    <input type="number" id="id_valor_bruto" name="valor_bruto" class="form-control form-control-lg"
                                           inputmode="decimal" step="0.01" min="0" required value="${j.valor_bruto}" placeholder="Ex.: 250.00">
                                    <button type="button" class="mic-btn"
                                            data-voice-target="id_valor_bruto" data-voice-type="number"
                                            data-voice-prompt="Valor bruto em reais." aria-label="Ditar valor">
                                        <i class="bi bi-mic-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="form-errors"></div>
                        <div class="d-flex flex-column flex-lg-row gap-2 justify-content-lg-end">
                            <a href="${editando ? '#/historico' : '#/'}" class="btn btn-outline-secondary order-lg-1">Cancelar</a>
                            <button type="submit" class="btn btn-success btn-lg order-lg-2 px-lg-5">
                                <i class="bi bi-check-lg"></i> ${editando ? 'Atualizar jornada' : 'Salvar jornada'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('form-jornada').addEventListener('submit', e => {
        e.preventDefault();
        const data = {
            data: byId('id_data').value,
            hora_inicio: byId('id_hora_inicio').value,
            hora_fim: byId('id_hora_fim').value,
            km_inicial: parseFloat(byId('id_km_inicial').value),
            km_final: parseFloat(byId('id_km_final').value),
            valor_bruto: parseFloat(byId('id_valor_bruto').value),
        };
        const errors = validar(data);
        const errBox = byId('form-errors');
        if (errors.length) {
            errBox.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle-fill me-2"></i>${errors.join('<br>')}</div>`;
            return;
        }
        errBox.innerHTML = '';
        const list = load();
        if (editando) {
            const idx = list.findIndex(x => x.id === jornada.id);
            list[idx] = { id: jornada.id, ...data };
            save(list);
            alerta('Jornada atualizada.');
            location.hash = '#/historico';
        } else {
            list.push({ id: nextId(list), ...data });
            save(list);
            alerta('Jornada registrada com sucesso!');
            location.hash = '#/';
        }
    });
}

function campoTime(name, label, icon, val, prompt) {
    return `
        <div class="mb-3">
            <label for="id_${name}" class="form-label"><i class="bi bi-${icon}"></i> ${label}</label>
            <div class="input-with-mic">
                <input type="time" id="id_${name}" name="${name}" class="form-control form-control-lg" required value="${val || ''}">
                <button type="button" class="mic-btn"
                        data-voice-target="id_${name}" data-voice-type="time"
                        data-voice-prompt="${prompt}" aria-label="Ditar ${label}">
                    <i class="bi bi-mic-fill"></i>
                </button>
            </div>
        </div>`;
}
function campoNumero(name, label, icon, val, step, prompt) {
    return `
        <div class="mb-3">
            <label for="id_${name}" class="form-label"><i class="bi bi-${icon}"></i> ${label}</label>
            <div class="input-with-mic">
                <input type="number" id="id_${name}" name="${name}" class="form-control form-control-lg"
                       inputmode="decimal" step="${step}" min="0" required value="${val ?? ''}" placeholder="Ex.: 12345">
                <button type="button" class="mic-btn"
                        data-voice-target="id_${name}" data-voice-type="number"
                        data-voice-prompt="${prompt}" aria-label="Ditar ${label}">
                    <i class="bi bi-mic-fill"></i>
                </button>
            </div>
        </div>`;
}
function byId(id) { return document.getElementById(id); }

function validar(d) {
    const erros = [];
    if (!d.data) erros.push('Informe a data.');
    if (!d.hora_inicio || !d.hora_fim) erros.push('Informe as horas de início e término.');
    if (isNaN(d.km_inicial) || isNaN(d.km_final)) erros.push('Informe a quilometragem.');
    if (d.km_final < d.km_inicial) erros.push('KM final não pode ser menor que KM inicial.');
    if (isNaN(d.valor_bruto) || d.valor_bruto < 0) erros.push('Informe um valor bruto válido.');
    return erros;
}

function renderExcluir(view, j) {
    view.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-lg-8 col-xl-6">
                <div class="section-title"><span>Confirmar exclusão</span></div>
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Esta ação não pode ser desfeita.
                </div>
                ${journeyCard(j, false)}
                <div class="d-grid gap-2 mt-3">
                    <button id="btn-confirm-delete" class="btn btn-danger btn-lg">
                        <i class="bi bi-trash"></i> Confirmar exclusão
                    </button>
                    <a href="#/historico" class="btn btn-outline-secondary">Cancelar</a>
                </div>
            </div>
        </div>
    `;
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        const list = load().filter(x => x.id !== j.id);
        save(list);
        alerta('Jornada excluída.');
        location.hash = '#/historico';
    });
}

// ─── Exportar / Importar ──────────────────────────────────────
function exportar() {
    const blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lucrometro-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}
function importar(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const arr = JSON.parse(reader.result);
            if (!Array.isArray(arr)) throw new Error('Formato inválido');
            save(arr);
            alerta(`Importadas ${arr.length} jornadas.`);
            render();
        } catch (e) { alerta('Arquivo inválido.', 'danger'); }
    };
    reader.readAsText(file);
}

document.getElementById('btn-export').addEventListener('click', e => { e.preventDefault(); exportar(); });
document.getElementById('btn-export-mobile').addEventListener('click', e => { e.preventDefault(); exportar(); });
document.getElementById('btn-import').addEventListener('click', e => {
    e.preventDefault(); document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', e => {
    if (e.target.files[0]) importar(e.target.files[0]);
});

// ─── Seed inicial (apenas na primeira visita) ─────────────────
if (!localStorage.getItem(KEY)) {
    const hoje = new Date();
    const seed = [
        [0, '07:00', '15:30', 45000.0, 45198.5, 285.50],
        [1, '06:30', '14:00', 44800.2, 45000.0, 240.00],
        [2, '18:00', '02:30', 44600.0, 44800.2, 320.75],
        [4, '08:00', '17:00', 44400.0, 44600.0, 295.00],
        [6, '07:15', '16:45', 44200.0, 44400.0, 310.20],
        [10,'09:00', '18:30', 43950.0, 44200.0, 275.50],
    ].map((row, i) => {
        const d = new Date(hoje); d.setDate(d.getDate() - row[0]);
        return {
            id: i + 1,
            data: d.toISOString().slice(0, 10),
            hora_inicio: row[1], hora_fim: row[2],
            km_inicial: row[3], km_final: row[4], valor_bruto: row[5],
        };
    });
    save(seed);
}

// ─── Boot ─────────────────────────────────────────────────────
render();
})();
