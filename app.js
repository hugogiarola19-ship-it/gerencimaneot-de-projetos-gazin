'use strict';

/* =========================================================
   Configuração das disciplinas, etapas e entregáveis
   ========================================================= */
const DISCIPLINAS = {
  eletrico: {
    nome: 'Elétrico',
    cor: 'var(--c-eletrico)',
    aprovacao: 'Concessionária de energia',
    entregaveis: [
      'Levantamento de cargas e padrão de entrada',
      'Quadro de cargas e balanceamento',
      'Diagrama unifilar / multifilar',
      'Planta de iluminação',
      'Planta de tomadas e pontos de força',
      'Alimentadores e infraestrutura (eletrocalhas/eletrodutos)',
      'SPDA e aterramento',
      'Cabeamento estruturado / CFTV / lógica',
      'Memorial descritivo e de cálculo',
      'Lista de materiais / orçamento',
      'Projeto aprovado na concessionária',
      'ART emitida'
    ]
  },
  climatizacao: {
    nome: 'Climatização',
    cor: 'var(--c-climatizacao)',
    aprovacao: 'Validação Gazin / fornecedor',
    entregaveis: [
      'Cálculo de carga térmica',
      'Definição e seleção de equipamentos',
      'Planta de layout das evaporadoras e condensadoras',
      'Rede frigorígena (dimensionamento)',
      'Rede de drenos',
      'Renovação de ar e exaustão',
      'Pontos elétricos para climatização (interface c/ elétrico)',
      'Detalhes de suportes e bases',
      'Memorial descritivo e de cálculo',
      'Lista de materiais / orçamento',
      'Plano PMOC',
      'ART emitida'
    ]
  },
  prevencao: {
    nome: 'Prevenção',
    cor: 'var(--c-prevencao)',
    aprovacao: 'Corpo de Bombeiros',
    entregaveis: [
      'Classificação da edificação e medidas exigidas',
      'Saídas de emergência e rotas de fuga',
      'Sinalização de emergência',
      'Iluminação de emergência',
      'Extintores',
      'Hidrantes / mangotinhos e reserva técnica',
      'Alarme e detecção de incêndio',
      'Memorial descritivo e de cálculo',
      'Protocolo do projeto (PPCI / PSCIP)',
      'Projeto aprovado no Corpo de Bombeiros',
      'Vistoria / emissão do certificado (AVCB/CLCB)',
      'ART emitida'
    ]
  }
};
const DISC_IDS = Object.keys(DISCIPLINAS);

const ETAPAS = [
  { nome: 'Aguardando informações', cor: '#98a2b3' },
  { nome: 'Levantamento',           cor: '#7a8cff' },
  { nome: 'Estudo preliminar',      cor: '#5b6cf0' },
  { nome: 'Projeto executivo',      cor: '#0a4a9c' },
  { nome: 'Revisão Gazin',          cor: '#d97706' },
  { nome: 'Aprovação externa',      cor: '#9e5cf0' },
  { nome: 'Concluído',              cor: '#12925a' }
];
const ULTIMA_ETAPA = ETAPAS.length - 1;

const TIPOS = ['Loja nova', 'Reforma de loja', 'Ampliação', 'Centro de distribuição', 'Escritório / administrativo', 'Indústria', 'Outro'];
const STATUS = ['Ativo', 'Pausado', 'Concluído', 'Cancelado'];

const STORAGE_KEY = 'gazin-complementares-v1';

/* =========================================================
   Estado e persistência
   ========================================================= */
let state = carregar();

function estadoVazio() {
  return { versao: 1, equipe: [], projetos: [] };
}

function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizarEstado(JSON.parse(raw));
  } catch (e) { console.warn('Falha ao ler dados salvos', e); }
  return estadoVazio();
}

function salvar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('Não foi possível salvar no navegador. Exporte um backup!');
  }
}

function normalizarEstado(s) {
  const base = estadoVazio();
  const out = { ...base, ...s };
  out.equipe = Array.isArray(out.equipe) ? out.equipe : [];
  out.projetos = (Array.isArray(out.projetos) ? out.projetos : []).map(normalizarProjeto);
  return out;
}

function novaDisciplina(ativa = true) {
  return { ativa, etapa: 0, inicio: '', prazo: '', responsavel: '', valor: '', revisao: 0, entregues: [], notas: '' };
}

function normalizarProjeto(p) {
  const proj = {
    id: p.id || uid(),
    codigo: p.codigo || '', nome: p.nome || '', cidade: p.cidade || '', uf: (p.uf || '').toUpperCase(),
    tipo: p.tipo || TIPOS[0], area: p.area ?? '', status: STATUS.includes(p.status) ? p.status : 'Ativo',
    solicitacao: p.solicitacao || '', prazoFinal: p.prazoFinal || '', contato: p.contato || '', obs: p.obs || '',
    criadoEm: p.criadoEm || new Date().toISOString(),
    historico: Array.isArray(p.historico) ? p.historico : [],
    disciplinas: {}
  };
  DISC_IDS.forEach(id => {
    proj.disciplinas[id] = { ...novaDisciplina(false), ...(p.disciplinas?.[id] || {}) };
    const d = proj.disciplinas[id];
    d.etapa = Math.min(Math.max(+d.etapa || 0, 0), ULTIMA_ETAPA);
    d.entregues = Array.isArray(d.entregues) ? d.entregues : [];
  });
  return proj;
}

/* =========================================================
   Utilitários
   ========================================================= */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function hojeISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function fmtData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

function diasAte(iso) {
  if (!iso) return null;
  const ms = new Date(iso + 'T00:00:00') - new Date(hojeISO() + 'T00:00:00');
  return Math.round(ms / 86400000);
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* Disciplina considerada "em aberto" (conta para prazos e atrasos) */
function emAberto(p, d) {
  return d.ativa && d.etapa < ULTIMA_ETAPA && (p.status === 'Ativo' || p.status === 'Pausado');
}
function atrasada(p, d) {
  return emAberto(p, d) && d.prazo && diasAte(d.prazo) < 0;
}
function progresso(d) {
  return Math.round((d.etapa / ULTIMA_ETAPA) * 100);
}

/* Lista plana de (projeto, disciplina) ativos */
function itens() {
  const out = [];
  state.projetos.forEach(p => DISC_IDS.forEach(id => {
    const d = p.disciplinas[id];
    if (d.ativa) out.push({ p, id, d });
  }));
  return out;
}

/* =========================================================
   Navegação
   ========================================================= */
let viewAtual = 'painel';

function mostrar(view) {
  viewAtual = view;
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  render();
}

function render() {
  ({ painel: renderPainel, projetos: renderProjetos, quadro: renderQuadro, prazos: renderPrazos, dados: renderDados })[viewAtual]();
}

/* =========================================================
   Painel
   ========================================================= */
function renderPainel() {
  const ativos = state.projetos.filter(p => p.status === 'Ativo');
  const todos = itens();
  const abertos = todos.filter(x => emAberto(x.p, x.d));
  const atrasados = abertos.filter(x => atrasada(x.p, x.d));
  const semana = abertos.filter(x => { const n = diasAte(x.d.prazo); return n !== null && n >= 0 && n <= 7; });
  const carteira = abertos.reduce((s, x) => s + (parseFloat(x.d.valor) || 0), 0);
  const concluidas = todos.filter(x => x.d.etapa === ULTIMA_ETAPA).length;

  $('#kpis').innerHTML = [
    ['Projetos ativos', ativos.length],
    ['Disciplinas em andamento', abertos.length],
    ['Atrasadas', atrasados.length, atrasados.length ? 'alerta' : ''],
    ['Vencem em 7 dias', semana.length],
    ['Disciplinas concluídas', concluidas],
    ['Valor em carteira', moeda.format(carteira)]
  ].map(([l, v, c]) => `<div class="kpi ${c || ''}"><small>${l}</small><strong>${v}</strong></div>`).join('');

  $('#por-disciplina').innerHTML = DISC_IDS.map(id => {
    const ds = todos.filter(x => x.id === id && x.p.status !== 'Cancelado');
    const media = ds.length ? Math.round(ds.reduce((s, x) => s + progresso(x.d), 0) / ds.length) : 0;
    const atr = ds.filter(x => atrasada(x.p, x.d)).length;
    return `<div class="disc-row">
      <strong><span class="disc-dot" style="background:${DISCIPLINAS[id].cor}"></span> ${DISCIPLINAS[id].nome}</strong>
      <div class="bar"><span style="width:${media}%;background:${DISCIPLINAS[id].cor}"></span></div>
      <span class="meta">${ds.length} proj. · ${media}%${atr ? ` · <b style="color:var(--erro)">${atr} atras.</b>` : ''}</span>
    </div>`;
  }).join('') || '<p class="empty">Sem dados.</p>';

  const prox = abertos.filter(x => x.d.prazo)
    .sort((a, b) => a.d.prazo.localeCompare(b.d.prazo)).slice(0, 8);
  $('#proximos').innerHTML = prox.length ? prox.map(itemPrazo).join('') : '<p class="empty">Nenhum prazo cadastrado.</p>';

  const contagem = ETAPAS.map((_, i) => abertos.filter(x => x.d.etapa === i).length + (i === ULTIMA_ETAPA ? concluidas : 0));
  const total = contagem.reduce((a, b) => a + b, 0);
  $('#por-etapa').innerHTML = total ? `
    <div class="stack">${ETAPAS.map((e, i) => contagem[i]
      ? `<span style="flex:${contagem[i]};background:${e.cor}" title="${e.nome}: ${contagem[i]}">${contagem[i]}</span>` : '').join('')}</div>
    <div class="legend">${ETAPAS.map((e, i) => `<span><i style="background:${e.cor}"></i>${e.nome} (${contagem[i]})</span>`).join('')}</div>`
    : '<p class="empty">Cadastre um projeto para ver a distribuição.</p>';
}

function tagPrazo(p, d) {
  if (d.etapa === ULTIMA_ETAPA) return '<span class="tag ok">Concluído</span>';
  if (!d.prazo) return '<span class="tag">sem prazo</span>';
  const n = diasAte(d.prazo);
  if (!emAberto(p, d)) return `<span class="tag">${fmtData(d.prazo)}</span>`;
  if (n < 0) return `<span class="tag atrasado">${-n}d atrasado</span>`;
  if (n === 0) return '<span class="tag atrasado">vence hoje</span>';
  return `<span class="tag">${n}d · ${fmtData(d.prazo)}</span>`;
}

function itemPrazo({ p, id, d }) {
  return `<div class="item" data-open="${p.id}" data-disc="${id}">
    <span class="disc-dot" style="background:${DISCIPLINAS[id].cor}"></span>
    <div class="grow"><strong>${esc(p.codigo ? p.codigo + ' · ' : '')}${esc(p.nome)}</strong>
      <small>${DISCIPLINAS[id].nome} · ${ETAPAS[d.etapa].nome}${d.responsavel ? ' · ' + esc(d.responsavel) : ''}</small></div>
    ${tagPrazo(p, d)}
  </div>`;
}

/* =========================================================
   Projetos (tabela)
   ========================================================= */
function preencherFiltros() {
  $('#f-status').innerHTML = '<option value="">Todos os status</option>' + STATUS.map(s => `<option>${s}</option>`).join('');
  $('#f-disc').innerHTML = '<option value="">Todas as disciplinas</option>' + DISC_IDS.map(id => `<option value="${id}">${DISCIPLINAS[id].nome}</option>`).join('');
  ['#q-disc', '#p-disc'].forEach(sel => {
    $(sel).innerHTML = `<button class="active" data-v="">Todas</button>` +
      DISC_IDS.map(id => `<button data-v="${id}">${DISCIPLINAS[id].nome}</button>`).join('');
  });
}

function renderProjetos() {
  const ufs = [...new Set(state.projetos.map(p => p.uf).filter(Boolean))].sort();
  const ufSel = $('#f-uf').value;
  $('#f-uf').innerHTML = '<option value="">Todas as UFs</option>' + ufs.map(u => `<option ${u === ufSel ? 'selected' : ''}>${u}</option>`).join('');

  const busca = $('#f-busca').value.trim().toLowerCase();
  const st = $('#f-status').value, disc = $('#f-disc').value, uf = $('#f-uf').value, soAtraso = $('#f-atraso').checked;

  const lista = state.projetos.filter(p => {
    if (st && p.status !== st) return false;
    if (uf && p.uf !== uf) return false;
    if (disc && !p.disciplinas[disc].ativa) return false;
    if (soAtraso && !DISC_IDS.some(id => (!disc || id === disc) && atrasada(p, p.disciplinas[id]))) return false;
    if (busca && ![p.codigo, p.nome, p.cidade, p.uf, p.contato, p.tipo].join(' ').toLowerCase().includes(busca)) return false;
    return true;
  }).sort((a, b) => (a.status === 'Ativo' ? 0 : 1) - (b.status === 'Ativo' ? 0 : 1) || (b.criadoEm || '').localeCompare(a.criadoEm || ''));

  $('#tbody-projetos').innerHTML = lista.map(p => `<tr data-open="${p.id}">
    <td><strong>${esc(p.codigo) || '—'}</strong></td>
    <td>${esc(p.nome)}${p.prazoFinal ? `<small>Entrega: ${fmtData(p.prazoFinal)}</small>` : ''}</td>
    <td>${esc(p.cidade)}${p.uf ? '/' + esc(p.uf) : ''}</td>
    <td>${esc(p.tipo)}</td>
    ${DISC_IDS.map(id => {
      const d = p.disciplinas[id];
      if (!d.ativa) return '<td><span class="tag na">não se aplica</span></td>';
      return `<td><span class="tag dot" style="color:${ETAPAS[d.etapa].cor}">${ETAPAS[d.etapa].nome}</span><small>${tagPrazo(p, d)}</small></td>`;
    }).join('')}
    <td><span class="tag dot st-${p.status}">${p.status}</span></td>
  </tr>`).join('');
  $('#empty-projetos').hidden = lista.length > 0;
}

/* =========================================================
   Quadro (kanban)
   ========================================================= */
function valorSeg(sel) { return $(sel + ' button.active')?.dataset.v || ''; }

function renderQuadro() {
  const disc = valorSeg('#q-disc');
  const busca = $('#q-busca').value.trim().toLowerCase();
  const lista = itens().filter(x =>
    (x.p.status === 'Ativo' || x.p.status === 'Pausado') &&
    (!disc || x.id === disc) &&
    (!busca || [x.p.codigo, x.p.nome, x.p.cidade, x.d.responsavel].join(' ').toLowerCase().includes(busca)));

  $('#kanban').innerHTML = ETAPAS.map((e, i) => {
    const col = lista.filter(x => x.d.etapa === i)
      .sort((a, b) => (a.d.prazo || '9999').localeCompare(b.d.prazo || '9999'));
    return `<div class="col" data-etapa="${i}">
      <div class="col-head"><span style="color:${e.cor}">● ${e.nome}</span><span>${col.length}</span></div>
      ${col.map(({ p, id, d }) => `<div class="kcard" draggable="true" data-open="${p.id}" data-disc="${id}" style="border-left-color:${DISCIPLINAS[id].cor}">
        <strong>${esc(p.codigo ? p.codigo + ' · ' : '')}${esc(p.nome)}</strong>
        <div class="meta"><span>${DISCIPLINAS[id].nome}</span>${d.responsavel ? `<span>· ${esc(d.responsavel)}</span>` : ''}
          ${p.status === 'Pausado' ? '<span class="tag st-Pausado">pausado</span>' : ''}</div>
        <div class="meta" style="margin-top:6px">${tagPrazo(p, d)}${d.entregues.length ? `<span class="tag">✓ ${d.entregues.length}/${DISCIPLINAS[id].entregaveis.length}</span>` : ''}</div>
      </div>`).join('')}
    </div>`;
  }).join('');
}

function ligarArrastar() {
  const board = $('#kanban');
  let arrastando = null;
  board.addEventListener('dragstart', e => {
    const c = e.target.closest('.kcard');
    if (!c) return;
    arrastando = c;
    c.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', c.dataset.open);
  });
  board.addEventListener('dragend', () => {
    arrastando?.classList.remove('dragging');
    arrastando = null;
    $$('.col.over').forEach(c => c.classList.remove('over'));
  });
  board.addEventListener('dragover', e => {
    const col = e.target.closest('.col');
    if (!col || !arrastando) return;
    e.preventDefault();
    $$('.col.over').forEach(c => c !== col && c.classList.remove('over'));
    col.classList.add('over');
  });
  board.addEventListener('drop', e => {
    const col = e.target.closest('.col');
    if (!col || !arrastando) return;
    e.preventDefault();
    const p = state.projetos.find(x => x.id === arrastando.dataset.open);
    const id = arrastando.dataset.disc;
    const nova = +col.dataset.etapa;
    if (p && p.disciplinas[id].etapa !== nova) {
      p.disciplinas[id].etapa = nova;
      registrar(p, `${DISCIPLINAS[id].nome}: etapa alterada para “${ETAPAS[nova].nome}”`);
      salvar();
      toast(`${DISCIPLINAS[id].nome} → ${ETAPAS[nova].nome}`);
    }
    renderQuadro();
  });
}

/* =========================================================
   Prazos
   ========================================================= */
function renderPrazos() {
  const disc = valorSeg('#p-disc');
  const mostrarConcl = $('#p-concluidos').checked;
  const lista = itens().filter(x =>
    (!disc || x.id === disc) &&
    x.p.status !== 'Cancelado' &&
    (mostrarConcl || emAberto(x.p, x.d)));

  const grupos = [
    ['Atrasados', x => emAberto(x.p, x.d) && x.d.prazo && diasAte(x.d.prazo) < 0],
    ['Esta semana', x => { const n = diasAte(x.d.prazo); return emAberto(x.p, x.d) && n !== null && n >= 0 && n <= 7; }],
    ['Próximos 30 dias', x => { const n = diasAte(x.d.prazo); return emAberto(x.p, x.d) && n > 7 && n <= 30; }],
    ['Mais adiante', x => emAberto(x.p, x.d) && diasAte(x.d.prazo) > 30],
    ['Sem prazo definido', x => emAberto(x.p, x.d) && !x.d.prazo],
    ['Concluídos / fora de andamento', x => !emAberto(x.p, x.d)]
  ];

  const html = grupos.map(([titulo, fn]) => {
    const g = lista.filter(fn).sort((a, b) => (a.d.prazo || '9999').localeCompare(b.d.prazo || '9999'));
    return g.length ? `<div class="grupo"><h3>${titulo} (${g.length})</h3><div class="card">${g.map(itemPrazo).join('')}</div></div>` : '';
  }).join('');
  $('#lista-prazos').innerHTML = html || '<p class="empty">Nenhuma disciplina em andamento.</p>';
}

/* =========================================================
   Dados (backup, CSV, equipe)
   ========================================================= */
function renderDados() {
  $('#inp-equipe').value = state.equipe.join('\n');
}

function baixar(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function exportarCSV() {
  const cab = ['Código', 'Unidade', 'Cidade', 'UF', 'Tipo', 'Área (m²)', 'Status do projeto', 'Contato Gazin', 'Entrega final',
    'Disciplina', 'Etapa', 'Progresso (%)', 'Responsável', 'Início', 'Prazo', 'Situação do prazo', 'Revisão', 'Entregáveis concluídos', 'Valor (R$)'];
  const linhas = itens().map(({ p, id, d }) => {
    const n = diasAte(d.prazo);
    const sit = d.etapa === ULTIMA_ETAPA ? 'Concluído' : !d.prazo ? 'Sem prazo' : n < 0 ? `Atrasado ${-n} dias` : `Faltam ${n} dias`;
    return [p.codigo, p.nome, p.cidade, p.uf, p.tipo, p.area, p.status, p.contato, fmtData(p.prazoFinal),
      DISCIPLINAS[id].nome, ETAPAS[d.etapa].nome, progresso(d), d.responsavel, fmtData(d.inicio), fmtData(d.prazo), sit,
      'R' + String(d.revisao).padStart(2, '0'), `${d.entregues.length}/${DISCIPLINAS[id].entregaveis.length}`,
      String(d.valor || '').replace('.', ',')];
  });
  const csv = [cab, ...linhas].map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  baixar(`projetos-gazin-${hojeISO()}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
}

function importarJSON(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const dados = normalizarEstado(JSON.parse(r.result));
      if (!confirm(`Importar ${dados.projetos.length} projeto(s)? Os dados atuais deste navegador serão substituídos.`)) return;
      state = dados;
      salvar();
      toast('Backup importado.');
      render();
    } catch (e) {
      alert('Arquivo inválido: ' + e.message);
    }
  };
  r.readAsText(file);
}

/* =========================================================
   Modal do projeto
   ========================================================= */
let editando = null;   // cópia do projeto sendo editado
let discAtiva = DISC_IDS[0];

function abrirProjeto(id, disc) {
  const orig = id ? state.projetos.find(p => p.id === id) : null;
  editando = orig ? structuredClone(orig) : normalizarProjeto({
    solicitacao: hojeISO(),
    disciplinas: Object.fromEntries(DISC_IDS.map(d => [d, novaDisciplina(true)]))
  });
  discAtiva = disc || DISC_IDS[0];

  const f = $('#form-projeto');
  $('#dlg-titulo').textContent = orig ? (orig.codigo || 'Projeto') + ' · ' + orig.nome : 'Novo projeto';
  f.tipo.innerHTML = TIPOS.map(t => `<option>${t}</option>`).join('');
  f.status.innerHTML = STATUS.map(s => `<option>${s}</option>`).join('');
  ['codigo', 'nome', 'tipo', 'cidade', 'uf', 'area', 'status', 'solicitacao', 'prazoFinal', 'contato', 'obs']
    .forEach(k => { f[k].value = editando[k] ?? ''; });
  $('#btn-excluir').hidden = !orig;

  renderDisciplinasForm();
  renderHistorico();
  $('#dlg').showModal();
}

function renderDisciplinasForm() {
  $('#disc-tabs').innerHTML = DISC_IDS.map(id => {
    const d = editando.disciplinas[id];
    return `<button type="button" class="disc-tab ${id === discAtiva ? 'active' : ''}" data-tab="${id}" style="--cor:${DISCIPLINAS[id].cor}">
      <span class="disc-dot" style="background:${d.ativa ? DISCIPLINAS[id].cor : '#cfd5df'}"></span>${DISCIPLINAS[id].nome}</button>`;
  }).join('');

  const equipe = `<datalist id="dl-equipe">${state.equipe.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`;
  $('#disc-panels').innerHTML = equipe + DISC_IDS.map(id => {
    const cfg = DISCIPLINAS[id], d = editando.disciplinas[id];
    return `<div class="disc-panel ${id === discAtiva ? 'active' : ''} ${d.ativa ? '' : 'off'}" data-panel="${id}">
      <label class="chk" style="margin-bottom:12px"><input type="checkbox" data-f="ativa" ${d.ativa ? 'checked' : ''}> Este projeto inclui ${cfg.nome.toLowerCase()}</label>
      <div class="disc-campos">
        <div class="grid-form">
          <label class="span-2">Etapa<select data-f="etapa">${ETAPAS.map((e, i) =>
            `<option value="${i}" ${i === d.etapa ? 'selected' : ''}>${i + 1}. ${e.nome}${i === 5 ? ' — ' + cfg.aprovacao : ''}</option>`).join('')}</select></label>
          <label class="span-2">Responsável<input data-f="responsavel" list="dl-equipe" value="${esc(d.responsavel)}"></label>
          <label>Início<input type="date" data-f="inicio" value="${esc(d.inicio)}"></label>
          <label>Prazo de entrega<input type="date" data-f="prazo" value="${esc(d.prazo)}"></label>
          <label>Revisão nº<input type="number" min="0" data-f="revisao" value="${esc(d.revisao)}"></label>
          <label>Valor / honorário (R$)<input type="number" min="0" step="any" data-f="valor" value="${esc(d.valor)}"></label>
          <label class="span-4">Notas da disciplina<textarea rows="2" data-f="notas">${esc(d.notas)}</textarea></label>
        </div>
        <div class="checklist">${cfg.entregaveis.map((nome, i) =>
          `<label><input type="checkbox" data-ent="${i}" ${d.entregues.includes(i) ? 'checked' : ''}> ${esc(nome)}</label>`).join('')}</div>
      </div>
    </div>`;
  }).join('');
}

function lerDisciplinasForm() {
  DISC_IDS.forEach(id => {
    const painel = $(`[data-panel="${id}"]`);
    const d = editando.disciplinas[id];
    $$('[data-f]', painel).forEach(el => {
      const k = el.dataset.f;
      d[k] = el.type === 'checkbox' ? el.checked : (k === 'etapa' || k === 'revisao') ? +el.value || 0 : el.value;
    });
    d.entregues = $$('[data-ent]', painel).filter(c => c.checked).map(c => +c.dataset.ent);
  });
}

function renderHistorico() {
  $('#hist-lista').innerHTML = editando.historico.length
    ? [...editando.historico].reverse().map(h => `<li><time>${fmtData(h.data)} ${h.data.slice(11, 16)}</time>${esc(h.texto)}</li>`).join('')
    : '<li class="hint" style="text-align:left">Sem registros ainda.</li>';
}

function registrar(p, texto) {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  p.historico.push({ data: local, texto });
}

function salvarProjeto() {
  const f = $('#form-projeto');
  lerDisciplinasForm();
  ['codigo', 'nome', 'tipo', 'cidade', 'uf', 'area', 'status', 'solicitacao', 'prazoFinal', 'contato', 'obs']
    .forEach(k => { editando[k] = f[k].value.trim(); });
  editando.uf = editando.uf.toUpperCase();

  const idx = state.projetos.findIndex(p => p.id === editando.id);
  if (idx >= 0) {
    const antigo = state.projetos[idx];
    DISC_IDS.forEach(id => {
      const a = antigo.disciplinas[id], n = editando.disciplinas[id];
      if (a.ativa && n.ativa && a.etapa !== n.etapa) registrar(editando, `${DISCIPLINAS[id].nome}: etapa alterada para “${ETAPAS[n.etapa].nome}”`);
      if (a.ativa !== n.ativa) registrar(editando, `${DISCIPLINAS[id].nome}: ${n.ativa ? 'incluída' : 'removida'} do escopo`);
    });
    if (antigo.status !== editando.status) registrar(editando, `Status do projeto: ${editando.status}`);
    state.projetos[idx] = editando;
  } else {
    registrar(editando, 'Projeto cadastrado');
    state.projetos.push(editando);
  }
  salvar();
  $('#dlg').close();
  toast('Projeto salvo.');
  render();
}

function ligarModal() {
  const dlg = $('#dlg');
  $$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));

  $('#disc-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    discAtiva = b.dataset.tab;
    $$('.disc-tab').forEach(t => t.classList.toggle('active', t === b));
    $$('.disc-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === discAtiva));
  });

  $('#disc-panels').addEventListener('change', e => {
    if (e.target.dataset.f === 'ativa') {
      const painel = e.target.closest('.disc-panel');
      painel.classList.toggle('off', !e.target.checked);
      $(`[data-tab="${painel.dataset.panel}"] .disc-dot`).style.background = e.target.checked ? DISCIPLINAS[painel.dataset.panel].cor : '#cfd5df';
    }
  });

  $('#form-projeto').addEventListener('submit', e => { e.preventDefault(); salvarProjeto(); });

  $('#btn-hist').addEventListener('click', () => {
    const inp = $('#hist-texto');
    if (!inp.value.trim()) return;
    registrar(editando, inp.value.trim());
    inp.value = '';
    renderHistorico();
  });
  $('#hist-texto').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); $('#btn-hist').click(); }
  });

  $('#btn-excluir').addEventListener('click', () => {
    if (!confirm('Excluir este projeto definitivamente?')) return;
    state.projetos = state.projetos.filter(p => p.id !== editando.id);
    salvar();
    dlg.close();
    toast('Projeto excluído.');
    render();
  });
}

/* =========================================================
   Dados de exemplo
   ========================================================= */
function exemplos() {
  const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const disc = (etapa, prazo, resp, valor, ent = []) => ({ ...novaDisciplina(true), etapa, prazo: d(prazo), inicio: d(-30), responsavel: resp, valor, entregues: ent });
  const off = () => novaDisciplina(false);
  return [
    { codigo: 'GZ-26-001', nome: 'Loja nova – Av. Brasil', cidade: 'Umuarama', uf: 'PR', tipo: 'Loja nova', area: 1250, prazoFinal: d(40),
      contato: 'Eng. obras Gazin', disciplinas: { eletrico: disc(3, 12, 'Hugo', 8500, [0, 1, 2]), climatizacao: disc(2, 20, 'Hugo', 6200, [0]), prevencao: disc(1, 35, 'Hugo', 5400) } },
    { codigo: 'GZ-26-002', nome: 'Reforma loja 218', cidade: 'Cuiabá', uf: 'MT', tipo: 'Reforma de loja', area: 820, prazoFinal: d(10),
      disciplinas: { eletrico: disc(4, -2, 'Hugo', 4800, [0, 1, 2, 3, 4, 8]), climatizacao: disc(5, 4, 'Hugo', 3900, [0, 1, 2, 3, 4, 8, 9]), prevencao: off() } },
    { codigo: 'GZ-26-003', nome: 'Centro de distribuição – ampliação', cidade: 'Douradina', uf: 'PR', tipo: 'Centro de distribuição', area: 6400, prazoFinal: d(90),
      disciplinas: { eletrico: disc(1, 45, 'Hugo', 22000), climatizacao: off(), prevencao: disc(2, 60, 'Hugo', 18000, [0]) } },
    { codigo: 'GZ-26-004', nome: 'Loja 145 – adequação AVCB', cidade: 'Porto Velho', uf: 'RO', tipo: 'Reforma de loja', area: 640, prazoFinal: d(5),
      disciplinas: { eletrico: off(), climatizacao: off(), prevencao: disc(5, 3, 'Hugo', 4200, [0, 1, 2, 3, 4, 5, 7, 8]) } },
    { codigo: 'GZ-25-019', nome: 'Loja nova – Shopping', cidade: 'Goiânia', uf: 'GO', tipo: 'Loja nova', area: 980, status: 'Concluído',
      disciplinas: { eletrico: disc(6, -20, 'Hugo', 7600, [...Array(12).keys()]), climatizacao: disc(6, -25, 'Hugo', 5800, [...Array(12).keys()]), prevencao: disc(6, -15, 'Hugo', 5000, [...Array(12).keys()]) } }
  ].map(p => { const n = normalizarProjeto({ solicitacao: d(-35), ...p }); registrar(n, 'Projeto de exemplo'); return n; });
}

/* =========================================================
   Inicialização
   ========================================================= */
function init() {
  preencherFiltros();

  $$('.tab').forEach(b => b.addEventListener('click', () => mostrar(b.dataset.view)));
  $('#btn-novo').addEventListener('click', () => abrirProjeto(null));

  // abrir projeto ao clicar em linhas/cartões/itens
  document.addEventListener('click', e => {
    const alvo = e.target.closest('[data-open]');
    if (alvo && !alvo.closest('dialog')) abrirProjeto(alvo.dataset.open, alvo.dataset.disc);
  });

  ['#f-busca', '#f-status', '#f-disc', '#f-uf', '#f-atraso'].forEach(s => $(s).addEventListener('input', renderProjetos));
  $('#q-busca').addEventListener('input', renderQuadro);
  $('#p-concluidos').addEventListener('change', renderPrazos);
  ['#q-disc', '#p-disc'].forEach(sel => $(sel).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $$(sel + ' button').forEach(x => x.classList.toggle('active', x === b));
    render();
  }));

  $('#btn-export-json').addEventListener('click', () =>
    baixar(`backup-projetos-gazin-${hojeISO()}.json`, JSON.stringify(state, null, 2), 'application/json'));
  $('#inp-import').addEventListener('change', e => { if (e.target.files[0]) importarJSON(e.target.files[0]); e.target.value = ''; });
  $('#btn-export-csv').addEventListener('click', exportarCSV);
  $('#btn-salvar-equipe').addEventListener('click', () => {
    state.equipe = [...new Set($('#inp-equipe').value.split('\n').map(s => s.trim()).filter(Boolean))];
    salvar();
    toast('Lista de responsáveis salva.');
  });
  $('#btn-exemplo').addEventListener('click', () => {
    state.projetos.push(...exemplos());
    if (!state.equipe.includes('Hugo')) state.equipe.push('Hugo');
    salvar();
    toast('Exemplos carregados.');
    mostrar('painel');
  });
  $('#btn-limpar').addEventListener('click', () => {
    if (!confirm('Apagar TODOS os projetos deste navegador? Exporte um backup antes se precisar.')) return;
    state = estadoVazio();
    salvar();
    toast('Dados apagados.');
    render();
  });

  ligarArrastar();
  ligarModal();

  // primeira visita: carrega exemplos para o sistema não abrir vazio
  if (!localStorage.getItem(STORAGE_KEY)) {
    state.projetos = exemplos();
    state.equipe = ['Hugo'];
    salvar();
  }
  render();
}

init();
