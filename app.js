'use strict';

/* =========================================================
   Configuração do fluxo de trabalho
   Ordem: recebe o layout → climatização → prevenção → elétrico
   ========================================================= */

// Climatização: quantidade de ar = área de venda ÷ (57000 / 700)
const FATOR_AR = 57000 / 700;

// Prevenção: acima deste limite de área total (m²) o projeto é completo, com hidrante (ocupação C-1).
// Valor padrão por estado; cada UF pode ser ajustada na aba "Dados" conforme a norma do Corpo de Bombeiros.
const LIMITE_HIDRANTE_PADRAO = 750;
// Estados onde a Gazin atua
const ESTADOS = { AC: 'Acre', AM: 'Amazonas', PA: 'Pará', RO: 'Rondônia', MT: 'Mato Grosso', GO: 'Goiás',
  TO: 'Tocantins', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', RS: 'Rio Grande do Sul' };
const UFS = Object.keys(ESTADOS);

// Norma de referência de cada estado, para conferir o limite de hidrante da ocupação C-1
const NORMAS = {
  AC: { nome: 'CBMAC – NT 22/2025 (hidrantes e mangotinhos)', url: 'https://www.cbmac.ac.gov.br/normas-tecnicas/' },
  AM: { nome: 'CBMAM – Instruções técnicas (portal SISGAT)', url: 'https://sisgat.cbm.am.gov.br/' },
  PA: { nome: 'CBMPA – IT 01 Parte I, Tabela 4C', url: 'https://www.bombeiros.pa.gov.br/wp-content/uploads/2019/01/IT-01-PARTE-I.pdf' },
  RO: { nome: 'CBMRO – IT 01/2022 Anexo A, Tabela 6C', url: 'https://www.cbm.ro.gov.br/wp-content/uploads/2024/01/6.ANEXO_A_-_IT-01_PROCEDIMENTOS_ADMINISTRATIVOS.pdf' },
  MT: { nome: 'CBMMT – NTCB 01/2026, Tabela 6C', url: 'https://www.bombeiros.mt.gov.br/documents/d/bombeiros/ntcb_0-1' },
  GO: { nome: 'CBMGO – NT 01/2026, Anexo A', url: 'https://www.bombeiros.go.gov.br/wp-content/uploads/2026/05/NT-01_2026_-_Procedimentos_Administrativos.pdf' },
  TO: { nome: 'CBMTO – NT 01 (Portaria 13/2022)', url: 'https://prevenir.bombeiros.to.gov.br/files/pdf/nt/nova/NT_01.pdf' },
  MS: { nome: 'CBMMS – norma técnica de exigências (link não localizado)', url: '' },
  MG: { nome: 'CBMMG – Decreto 47.998/2020, tabela do Grupo C', url: 'https://www.almg.gov.br/legislacao-mineira/texto/DEC/47998/2020/' },
  RS: { nome: 'CBMRS – Decreto 51.803/2014 e RT 05, Tabela 6C', url: 'https://www.bombeiros.rs.gov.br/upload/arquivos/202001/17121500-dec-51803-14-ate-54942-19.pdf' }
};

// Classificação da ocupação das lojas no Corpo de Bombeiros
const OCUPACAO = 'C-1';

// Elétrico: tabela de circuitos padrão (Descrição; Esquema; Método de inst.; Tensão; Seção mm²; Disjuntor A).
// As linhas "AR nn" formam o bloco de ar-condicionado: o sistema mantém tantas quantos forem os equipamentos.
const CIRCUITOS_PADRAO = `ILUM. VENDAS 01; F+F; B1; 220 V; 2,5; 10
ILUM. VENDAS 02; F+F; B1; 220 V; 4; 10
ILUM. EXTERNA; F+F+T; B1; 220 V; 2,5; 10
ILUM. SPOT; F+F+T; B1; 220 V; 2,5; 10
ILUM. EMERGÊNCIA; F+F+T; B1; 220 V; 2,5; 10
ILUM. B.W.C/COPA/DEP; F+F; B1; 220 V; 2,5; 10
AR 01; F+F+T; B1; 220 V; 6; 40
AR 02; F+F+T; B1; 220 V; 6; 40
AR 03; F+F+T; B1; 220 V; 6; 40
AR 04; F+F+T; B1; 220 V; 6; 40
AR 05; F+F+T; B1; 220 V; 6; 40
AR 06; F+F+T; B1; 220 V; 6; 40
AR 07; F+F+T; B1; 220 V; 10; 40
AR 08; F+F+T; B1; 220 V; 6; 20
MOTOR PORTA; F+F+T; B1; 220 V; 2,5; 16
CORTINA DE AR; F+F+T; B1; 220 V; 2,5; 10
NOBREAK; 2F+N+T; B1; 220/127 V; 6; 32
TUG CUIDADOS PESSOAIS; F+N+T; B1; 127 V; 2,5; 10
TUG ILHA DE TECNOLOGIA; F+F+T; B1; 220 V; 2,5; 10
TV 01; F+F+T; B1; 220 V; 2,5; 10
TV 02; F+F+T; B1; 220 V; 2,5; 10
TUG B.W.C; F+F+T; B1; 220 V; 4; 10
TUG COPA/BEBEDOURO; F+F+T; B1; 220 V; 4; 10
TUG ALARME/SOM; F+F+T; B1; 220 V; 2,5; 10
TUG AVAN. COZINHA/ROUPEIRO; F+F+T; B1; 220 V; 2,5; 16
TUG PORTA 127V; F+N+T; B1; 127 V; 6; 40
TUG PORTA 220V; F+F+T; B1; 220 V; 6; 40`;

const PASSO_PDF = { id: 'pdf', nome: 'Gerar PDF' };
const PASSO_ENVIO = { id: 'envio', nome: 'Enviar no grupo e no Drive' };

const DISCIPLINAS = {
  climatizacao: {
    nome: 'Climatização',
    cor: 'var(--c-climatizacao)',
    passos: [
      { id: 'calculo', nome: 'Calcular quantidade de ar (área de venda ÷ 57000/700)' },
      { id: 'distribuicao', nome: 'Distribuir equipamentos no prédio (avanço, painel de TVs)' },
      { id: 'dreno', nome: 'Cotar centro e ponto de dreno' },
      PASSO_PDF, PASSO_ENVIO
    ]
  },
  prevencao: {
    nome: 'Prevenção',
    cor: 'var(--c-prevencao)',
    passos: [
      { id: 'norma', nome: 'Verificar norma do estado para ocupação C-1 (completo ou simplificado)' },
      { id: 'sinalizacao', nome: 'Posicionar placas de sinalização' },
      { id: 'iluminacao', nome: 'Posicionar iluminação de emergência' },
      { id: 'extintores', nome: 'Posicionar extintores' },
      { id: 'hidrantes', nome: 'Hidrantes e reserva técnica', so: 'completo' },
      PASSO_PDF, PASSO_ENVIO
    ]
  },
  eletrico: {
    nome: 'Elétrico',
    cor: 'var(--c-eletrico)',
    passos: [
      { id: 'distribuicao', nome: 'Distribuir lâmpadas, tomadas, pontos de ar e demais pontos (tabela de circuitos)' },
      { id: 'caixa', nome: 'Detalhe: caixa' },
      { id: 'leg-condutos', nome: 'Detalhe: legenda de condutos' },
      { id: 'leg-fios', nome: 'Detalhe: legenda de fios' },
      { id: 'leg-pecas', nome: 'Detalhe: legenda de peças' },
      { id: 'quadro-cargas', nome: 'Detalhe: quadro de cargas' },
      { id: 'quadro-demanda', nome: 'Detalhe: quadro de demanda' },
      { id: 'unifilar', nome: 'Detalhe: diagrama unifilar' },
      { id: 'cotas', nome: 'Cotar todos os pontos elétricos' },
      PASSO_PDF, PASSO_ENVIO
    ]
  }
};
const DISC_IDS = Object.keys(DISCIPLINAS);

const ETAPAS = [
  { nome: 'Aguardando layout', cor: '#98a2b3' },
  { nome: 'A fazer',           cor: '#7a8cff' },
  { nome: 'Em andamento',      cor: '#0a4a9c' },
  { nome: 'Revisão / ajustes', cor: '#d97706' },
  { nome: 'Entregue',          cor: '#12925a' }
];
const ULTIMA_ETAPA = ETAPAS.length - 1;
const ETAPA_REVISAO = 3;

const TIPOS = ['Loja nova', 'Reforma de loja', 'Ampliação', 'Centro de distribuição', 'Escritório / administrativo', 'Outro'];
const STATUS = ['Ativo', 'Pausado', 'Concluído', 'Cancelado'];
const CAMPOS_GERAIS = ['codigo', 'nome', 'tipo', 'cidade', 'uf', 'areaTotal', 'areaVenda', 'layout', 'prazoFinal', 'status', 'drive', 'contato', 'obs'];

const STORAGE_KEY = 'gazin-complementares-v2';

/* =========================================================
   Estado e persistência
   ========================================================= */
let state = carregar();

function estadoVazio() {
  return { versao: 2, equipe: [], config: { limites: {}, circuitos: CIRCUITOS_PADRAO }, projetos: [] };
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
  const out = { ...base, ...s, versao: 2 };
  out.equipe = Array.isArray(out.equipe) ? out.equipe : [];
  out.config = { ...base.config, ...(s.config || {}) };
  out.config.limites = out.config.limites && typeof out.config.limites === 'object' ? out.config.limites : {};
  out.projetos = (Array.isArray(out.projetos) ? out.projetos : []).map(normalizarProjeto);
  return out;
}

function novaDisciplina(ativa = true) {
  return { ativa, etapa: 0, prazo: '', responsavel: '', valor: '', revisao: 0, feitos: [], notas: '', entregueEm: '',
    equipamentos: '', classificacao: 'auto', circuitosAr: '' };
}

function normalizarProjeto(p) {
  const proj = {
    id: p.id || uid(),
    codigo: p.codigo || '', nome: p.nome || '', tipo: p.tipo || TIPOS[0],
    cidade: p.cidade || '', uf: (p.uf || '').toUpperCase(),
    areaTotal: p.areaTotal ?? p.area ?? '', areaVenda: p.areaVenda ?? '',
    layout: p.layout || '', prazoFinal: p.prazoFinal || '',
    status: STATUS.includes(p.status) ? p.status : 'Ativo',
    drive: p.drive || '', contato: p.contato || '', obs: p.obs || '',
    criadoEm: p.criadoEm || new Date().toISOString(),
    historico: Array.isArray(p.historico) ? p.historico : [],
    disciplinas: {}
  };
  DISC_IDS.forEach(id => {
    const d = { ...novaDisciplina(false), ...(p.disciplinas?.[id] || {}) };
    d.etapa = Math.min(Math.max(+d.etapa || 0, 0), ULTIMA_ETAPA);
    d.feitos = Array.isArray(d.feitos) ? d.feitos.filter(f => typeof f === 'string') : [];
    proj.disciplinas[id] = d;
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

function isoLocal(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}
function hojeISO() { return isoLocal().slice(0, 10); }

function fmtData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

function diasAte(iso) {
  if (!iso) return null;
  const ms = new Date(iso.slice(0, 10) + 'T00:00:00') - new Date(hojeISO() + 'T00:00:00');
  return Math.round(ms / 86400000);
}

const num2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function urlSegura(u) {
  return /^https?:\/\//i.test(u || '') ? u : '';
}

/* =========================================================
   Cálculos automáticos
   ========================================================= */

/* Climatização: quantidade de ar com duas casas decimais */
function qtdAr(p) {
  const a = parseFloat(p.areaVenda);
  return a > 0 ? Math.round((a / FATOR_AR) * 100) / 100 : null;
}

/* Número de equipamentos adotado: valor informado ou a quantidade de ar arredondada para cima */
function equipamentosAr(p) {
  const n = parseInt(p.disciplinas.climatizacao.equipamentos, 10);
  if (n > 0) return n;
  const q = qtdAr(p);
  return q ? Math.ceil(q) : 0;
}

/* Limite confirmado = valor salvo na aba Dados; sem ele vale o padrão de 750 m², ainda a confirmar */
function limiteConfirmado(uf) {
  return parseFloat(state.config.limites[uf]) > 0;
}

function limiteUF(uf) {
  const v = parseFloat(state.config.limites[uf]);
  return v > 0 ? v : LIMITE_HIDRANTE_PADRAO;
}

/* Prevenção: 'completo' (com hidrante), 'simplificado' ou null se faltar área/UF */
function tipoPrevencao(p) {
  const c = p.disciplinas.prevencao.classificacao;
  if (c === 'completo' || c === 'simplificado') return c;
  const a = parseFloat(p.areaTotal);
  if (!(a > 0) || !p.uf) return null;
  return a > limiteUF(p.uf) ? 'completo' : 'simplificado';
}

function nomePrevencao(t) {
  return t === 'completo' ? 'Completo (com hidrante)' : t === 'simplificado' ? 'Simplificado (sem hidrante)' : 'Informe área total e UF';
}

function circuitosArDe(p) {
  const n = parseInt(p.disciplinas.eletrico.circuitosAr, 10);
  return n >= 0 && p.disciplinas.eletrico.circuitosAr !== '' ? n : equipamentosAr(p);
}

function lerTabelaCircuitos(texto) {
  return String(texto || '').split('\n').map(l => l.split(';').map(c => c.trim())).filter(c => c[0]);
}

/* Gera o quadro de circuitos do projeto a partir da tabela padrão, com N circuitos de ar */
function gerarCircuitos(p) {
  const base = lerTabelaCircuitos(state.config.circuitos);
  const ehAr = c => /^AR\s*\d+$/i.test(c[0]);
  const ar = base.filter(ehAr);
  const n = circuitosArDe(p);
  const out = [];
  let inseriuAr = false;
  base.forEach(c => {
    if (!ehAr(c)) { out.push(c); return; }
    if (inseriuAr) return;
    inseriuAr = true;
    for (let i = 0; i < n; i++) {
      const modelo = ar[i] || ar[0];
      out.push([`AR ${String(i + 1).padStart(2, '0')}`, ...modelo.slice(1)]);
    }
  });
  return out.map((c, i) => [String(i + 1), ...c]);
}

/* Passos visíveis da disciplina (hidrante só aparece no projeto completo) */
function passosDe(p, id) {
  return DISCIPLINAS[id].passos.filter(s => !s.so || s.so === tipoPrevencao(p));
}

function contagem(p, id) {
  const passos = passosDe(p, id);
  const feitos = passos.filter(s => p.disciplinas[id].feitos.includes(s.id)).length;
  return { feitos, total: passos.length };
}

function progresso(p, id) {
  if (p.disciplinas[id].etapa === ULTIMA_ETAPA) return 100;
  const { feitos, total } = contagem(p, id);
  return total ? Math.round((feitos / total) * 100) : 0;
}

/* Avança a etapa automaticamente conforme o layout e o checklist (nunca rebaixa, exceto sem layout) */
function ajustarEtapa(p, id) {
  const d = p.disciplinas[id];
  const { feitos, total } = contagem(p, id);
  if (!p.layout && d.etapa <= 1) d.etapa = 0;
  if (p.layout && d.etapa === 0) d.etapa = 1;
  if (feitos > 0 && d.etapa < 2) d.etapa = 2;
  if (total && feitos === total && d.etapa < ETAPA_REVISAO) d.etapa = ULTIMA_ETAPA;
  if (d.etapa === ULTIMA_ETAPA && !d.entregueEm) d.entregueEm = hojeISO();
  if (d.etapa < ULTIMA_ETAPA) d.entregueEm = '';
}

/* Disciplina considerada "em aberto" (conta para prazos e atrasos) */
function emAberto(p, d) {
  return d.ativa && d.etapa < ULTIMA_ETAPA && (p.status === 'Ativo' || p.status === 'Pausado');
}
function atrasada(p, d) {
  return emAberto(p, d) && d.prazo && diasAte(d.prazo) < 0;
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
  const semLayout = ativos.filter(p => !p.layout);
  const todos = itens();
  const abertos = todos.filter(x => emAberto(x.p, x.d));
  const atrasados = abertos.filter(x => atrasada(x.p, x.d));
  const semana = abertos.filter(x => { const n = diasAte(x.d.prazo); return n !== null && n >= 0 && n <= 7; });
  const entregues30 = todos.filter(x => x.d.etapa === ULTIMA_ETAPA && x.d.entregueEm && diasAte(x.d.entregueEm) >= -30).length;

  $('#kpis').innerHTML = [
    ['Projetos ativos', ativos.length],
    ['Aguardando layout', semLayout.length],
    ['Disciplinas em aberto', abertos.length],
    ['Atrasadas', atrasados.length, atrasados.length ? 'alerta' : ''],
    ['Vencem em 7 dias', semana.length],
    ['Entregues (30 dias)', entregues30]
  ].map(([l, v, c]) => `<div class="kpi ${c || ''}"><small>${l}</small><strong>${v}</strong></div>`).join('');

  $('#por-disciplina').innerHTML = DISC_IDS.map(id => {
    const ds = todos.filter(x => x.id === id && x.p.status !== 'Cancelado');
    const media = ds.length ? Math.round(ds.reduce((s, x) => s + progresso(x.p, id), 0) / ds.length) : 0;
    const atr = ds.filter(x => atrasada(x.p, x.d)).length;
    return `<div class="disc-row">
      <strong><span class="disc-dot" style="background:${DISCIPLINAS[id].cor}"></span> ${DISCIPLINAS[id].nome}</strong>
      <div class="bar"><span style="width:${media}%;background:${DISCIPLINAS[id].cor}"></span></div>
      <span class="meta">${ds.length} proj. · ${media}%${atr ? ` · <b style="color:var(--erro)">${atr} atras.</b>` : ''}</span>
    </div>`;
  }).join('');

  const prox = abertos.filter(x => x.d.prazo)
    .sort((a, b) => a.d.prazo.localeCompare(b.d.prazo)).slice(0, 8);
  $('#proximos').innerHTML = prox.length ? prox.map(itemPrazo).join('') : '<p class="empty">Nenhum prazo cadastrado.</p>';

  const porEtapa = ETAPAS.map((_, i) => todos.filter(x => x.p.status !== 'Cancelado' && x.d.etapa === i).length);
  const total = porEtapa.reduce((a, b) => a + b, 0);
  $('#por-etapa').innerHTML = total ? `
    <div class="stack">${ETAPAS.map((e, i) => porEtapa[i]
      ? `<span style="flex:${porEtapa[i]};background:${e.cor}" title="${e.nome}: ${porEtapa[i]}">${porEtapa[i]}</span>` : '').join('')}</div>
    <div class="legend">${ETAPAS.map((e, i) => `<span><i style="background:${e.cor}"></i>${e.nome} (${porEtapa[i]})</span>`).join('')}</div>`
    : '<p class="empty">Cadastre um projeto para ver a distribuição.</p>';
}

function tagPrazo(p, d) {
  if (d.etapa === ULTIMA_ETAPA) return `<span class="tag ok">Entregue${d.entregueEm ? ' ' + fmtData(d.entregueEm) : ''}</span>`;
  if (!d.prazo) return '<span class="tag">sem prazo</span>';
  const n = diasAte(d.prazo);
  if (!emAberto(p, d)) return `<span class="tag">${fmtData(d.prazo)}</span>`;
  if (n < 0) return `<span class="tag atrasado">${-n}d atrasado</span>`;
  if (n === 0) return '<span class="tag atrasado">vence hoje</span>';
  return `<span class="tag">${n}d · ${fmtData(d.prazo)}</span>`;
}

function itemPrazo({ p, id, d }) {
  const { feitos, total } = contagem(p, id);
  return `<div class="item" data-open="${p.id}" data-disc="${id}">
    <span class="disc-dot" style="background:${DISCIPLINAS[id].cor}"></span>
    <div class="grow"><strong>${esc(p.codigo ? p.codigo + ' · ' : '')}${esc(p.nome)}</strong>
      <small>${DISCIPLINAS[id].nome} · ${ETAPAS[d.etapa].nome} · ${feitos}/${total} passos${d.responsavel ? ' · ' + esc(d.responsavel) : ''}</small></div>
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
  $('#th-disc').outerHTML = DISC_IDS.map(id => `<th>${DISCIPLINAS[id].nome}</th>`).join('');
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
    <td><strong>${esc(p.codigo) || '—'}</strong>${p.layout ? `<small>Layout ${fmtData(p.layout)}</small>` : '<small class="aviso">sem layout</small>'}</td>
    <td>${esc(p.nome)}<small>${esc(p.tipo)}</small></td>
    <td>${esc(p.cidade)}${p.uf ? '/' + esc(p.uf) : ''}</td>
    <td>${p.areaVenda ? num0.format(p.areaVenda) : '—'} / ${p.areaTotal ? num0.format(p.areaTotal) : '—'}</td>
    ${DISC_IDS.map(id => {
      const d = p.disciplinas[id];
      if (!d.ativa) return '<td><span class="tag na">não se aplica</span></td>';
      const { feitos, total } = contagem(p, id);
      return `<td><span class="tag dot" style="color:${ETAPAS[d.etapa].cor}">${ETAPAS[d.etapa].nome}</span>
        <small>${feitos}/${total} passos · ${d.etapa === ULTIMA_ETAPA ? 'em ' + fmtData(d.entregueEm) : tagPrazo(p, d)}</small></td>`;
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
      ${col.map(({ p, id, d }) => {
        const { feitos, total } = contagem(p, id);
        return `<div class="kcard" draggable="true" data-open="${p.id}" data-disc="${id}" style="border-left-color:${DISCIPLINAS[id].cor}">
        <strong>${esc(p.codigo ? p.codigo + ' · ' : '')}${esc(p.nome)}</strong>
        <div class="meta"><span>${DISCIPLINAS[id].nome}</span>${p.uf ? `<span>· ${esc(p.cidade)}/${esc(p.uf)}</span>` : ''}
          ${p.status === 'Pausado' ? '<span class="tag st-Pausado">pausado</span>' : ''}</div>
        <div class="bar fina"><span style="width:${progresso(p, id)}%;background:${DISCIPLINAS[id].cor}"></span></div>
        <div class="meta">${tagPrazo(p, d)}<span class="tag">✓ ${feitos}/${total}</span></div>
      </div>`;
      }).join('')}
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
      const d = p.disciplinas[id];
      d.etapa = nova;
      d.entregueEm = nova === ULTIMA_ETAPA ? (d.entregueEm || hojeISO()) : '';
      if (nova === ETAPA_REVISAO) d.revisao = (+d.revisao || 0) + 1;
      registrar(p, `${DISCIPLINAS[id].nome}: etapa alterada para “${ETAPAS[nova].nome}”${nova === ETAPA_REVISAO ? ` (R${String(d.revisao).padStart(2, '0')})` : ''}`);
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
    ['Entregues / fora de andamento', x => !emAberto(x.p, x.d)]
  ];

  const html = grupos.map(([titulo, fn]) => {
    const g = lista.filter(fn).sort((a, b) => (a.d.prazo || '9999').localeCompare(b.d.prazo || '9999'));
    return g.length ? `<div class="grupo"><h3>${titulo} (${g.length})</h3><div class="card">${g.map(itemPrazo).join('')}</div></div>` : '';
  }).join('');
  $('#lista-prazos').innerHTML = html || '<p class="empty">Nenhuma disciplina em andamento.</p>';
}

/* =========================================================
   Dados (backup, CSV, configurações)
   ========================================================= */
function renderDados() {
  $('#inp-equipe').value = state.equipe.join('\n');
  $('#inp-circuitos').value = state.config.circuitos;
  $('#grid-limites').innerHTML = UFS.map(uf =>
    `<div class="uf-item"><label>${uf} · ${ESTADOS[uf]}
      <input type="number" min="1" step="any" data-uf="${uf}" value="${esc(state.config.limites[uf] ?? '')}" placeholder="${LIMITE_HIDRANTE_PADRAO} (a confirmar)"></label>
      <small>${limiteConfirmado(uf) ? '<span class="ok-txt">✓ confirmado</span>' : '<span class="aviso">a confirmar</span>'} ·
      ${NORMAS[uf].url ? `<a href="${NORMAS[uf].url}" target="_blank" rel="noopener">${esc(NORMAS[uf].nome)} ↗</a>` : esc(NORMAS[uf].nome)}</small></div>`).join('');
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

function csv(linhas) {
  return '﻿' + linhas.map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
}

function exportarCSV() {
  const cab = ['Código', 'Unidade', 'Tipo', 'Cidade', 'UF', 'Área total (m²)', 'Área de venda (m²)', 'Layout recebido', 'Status do projeto',
    'Qtd. de ar', 'Equipamentos', 'Prevenção', 'Disciplina', 'Etapa', 'Passos feitos', 'Progresso (%)', 'Responsável', 'Prazo',
    'Situação do prazo', 'Revisão', 'Entregue em', 'Valor (R$)'];
  const linhas = itens().map(({ p, id, d }) => {
    const n = diasAte(d.prazo);
    const { feitos, total } = contagem(p, id);
    const sit = d.etapa === ULTIMA_ETAPA ? 'Entregue' : !d.prazo ? 'Sem prazo' : n < 0 ? `Atrasado ${-n} dias` : `Faltam ${n} dias`;
    const q = qtdAr(p);
    return [p.codigo, p.nome, p.tipo, p.cidade, p.uf, p.areaTotal, p.areaVenda, fmtData(p.layout), p.status,
      q === null ? '' : num2.format(q), equipamentosAr(p) || '', nomePrevencao(tipoPrevencao(p)),
      DISCIPLINAS[id].nome, ETAPAS[d.etapa].nome, `${feitos}/${total}`, progresso(p, id), d.responsavel, fmtData(d.prazo), sit,
      'R' + String(d.revisao).padStart(2, '0'), fmtData(d.entregueEm), String(d.valor || '').replace('.', ',')];
  });
  baixar(`projetos-gazin-${hojeISO()}.csv`, csv([cab, ...linhas]), 'text/csv;charset=utf-8');
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
    disciplinas: Object.fromEntries(DISC_IDS.map(d => [d, novaDisciplina(true)]))
  });
  discAtiva = disc || DISC_IDS[0];

  const f = $('#form-projeto');
  $('#dlg-titulo').textContent = orig ? (orig.codigo || 'Projeto') + ' · ' + orig.nome : 'Novo projeto';
  f.tipo.innerHTML = TIPOS.map(t => `<option>${t}</option>`).join('');
  f.status.innerHTML = STATUS.map(s => `<option>${s}</option>`).join('');
  const ufs = editando.uf && !UFS.includes(editando.uf) ? [...UFS, editando.uf] : UFS;
  f.uf.innerHTML = '<option value="">—</option>' + ufs.map(u => `<option value="${u}">${u}${ESTADOS[u] ? ' – ' + ESTADOS[u] : ''}</option>`).join('');
  CAMPOS_GERAIS.forEach(k => { f[k].value = editando[k] ?? ''; });
  $('#btn-excluir').hidden = !orig;

  renderDisciplinasForm();
  renderHistorico();
  atualizarCalculos();
  $('#dlg').showModal();
}

function renderDisciplinasForm() {
  $('#disc-tabs').innerHTML = DISC_IDS.map((id, i) => {
    const d = editando.disciplinas[id];
    return `<button type="button" class="disc-tab ${id === discAtiva ? 'active' : ''}" data-tab="${id}" style="--cor:${DISCIPLINAS[id].cor}">
      <span class="disc-dot" style="background:${d.ativa ? DISCIPLINAS[id].cor : '#cfd5df'}"></span>${i + 1}. ${DISCIPLINAS[id].nome}</button>`;
  }).join('');

  const extras = {
    climatizacao: d => `<label>Equipamentos adotados<input type="number" min="0" data-f="equipamentos" value="${esc(d.equipamentos)}" data-auto="equipamentos"></label>`,
    prevencao: d => `<label class="span-2">Classificação<select data-f="classificacao">
        <option value="auto" ${d.classificacao === 'auto' ? 'selected' : ''}>Automática (área total × limite da UF)</option>
        <option value="completo" ${d.classificacao === 'completo' ? 'selected' : ''}>Completo (com hidrante)</option>
        <option value="simplificado" ${d.classificacao === 'simplificado' ? 'selected' : ''}>Simplificado (sem hidrante)</option>
      </select></label>`,
    eletrico: d => `<label>Circuitos de ar<input type="number" min="0" data-f="circuitosAr" value="${esc(d.circuitosAr)}" data-auto="circuitosAr"></label>`
  };

  const equipe = `<datalist id="dl-equipe">${state.equipe.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`;
  $('#disc-panels').innerHTML = equipe + DISC_IDS.map(id => {
    const cfg = DISCIPLINAS[id], d = editando.disciplinas[id];
    return `<div class="disc-panel ${id === discAtiva ? 'active' : ''} ${d.ativa ? '' : 'off'}" data-panel="${id}">
      <label class="chk" style="margin-bottom:12px"><input type="checkbox" data-f="ativa" ${d.ativa ? 'checked' : ''}> Este projeto inclui ${cfg.nome.toLowerCase()}</label>
      <div class="disc-campos">
        <div class="grid-form">
          <label class="span-2">Etapa<select data-f="etapa">${ETAPAS.map((e, i) =>
            `<option value="${i}" ${i === d.etapa ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label>
          <label class="span-2">Responsável<input data-f="responsavel" list="dl-equipe" value="${esc(d.responsavel)}"></label>
          <label>Prazo de entrega<input type="date" data-f="prazo" value="${esc(d.prazo)}"></label>
          <label>Revisão nº<input type="number" min="0" data-f="revisao" value="${esc(d.revisao)}"></label>
          <label>Valor (R$)<input type="number" min="0" step="any" data-f="valor" value="${esc(d.valor)}"></label>
          ${extras[id](d)}
        </div>
        <h3 class="sub">Passo a passo</h3>
        <ol class="checklist">${cfg.passos.map(s =>
          `<li data-passo="${s.id}" ${s.so ? `data-so="${s.so}"` : ''}><label><input type="checkbox" data-feito="${s.id}" ${d.feitos.includes(s.id) ? 'checked' : ''}> ${esc(s.nome)}</label></li>`).join('')}</ol>
        ${id === 'eletrico' ? `<div class="circuitos">
          <div class="row"><h3 class="sub grow" id="tit-circuitos">Quadro de circuitos</h3>
            <button type="button" class="btn sm" id="btn-copiar-circ">Copiar tabela</button>
            <button type="button" class="btn sm" id="btn-csv-circ">Baixar .csv</button></div>
          <div class="table-wrap"><table class="table mini"><thead><tr><th>Circ.</th><th>Descrição</th><th>Esquema</th><th>Método</th><th>Tensão</th><th>Seção (mm²)</th><th>Disj. (A)</th></tr></thead>
          <tbody id="tbody-circuitos"></tbody></table></div></div>` : ''}
        <label class="notas">Notas<textarea rows="2" data-f="notas">${esc(d.notas)}</textarea></label>
      </div>
    </div>`;
  }).join('');
}

function lerFormulario() {
  const f = $('#form-projeto');
  CAMPOS_GERAIS.forEach(k => { editando[k] = f[k].value.trim(); });
  editando.uf = editando.uf.toUpperCase();
  DISC_IDS.forEach(id => {
    const painel = $(`[data-panel="${id}"]`);
    const d = editando.disciplinas[id];
    $$('[data-f]', painel).forEach(el => {
      const k = el.dataset.f;
      d[k] = el.type === 'checkbox' ? el.checked : (k === 'etapa' || k === 'revisao') ? +el.value || 0 : el.value;
    });
    d.feitos = $$('[data-feito]', painel).filter(c => c.checked).map(c => c.dataset.feito);
  });
}

/* Atualiza o resumo automático, o passo de hidrante e o quadro de circuitos enquanto o formulário é editado */
function atualizarCalculos() {
  lerFormulario();
  const p = editando;
  const q = qtdAr(p);
  const equip = equipamentosAr(p);
  const tipo = tipoPrevencao(p);
  const circ = gerarCircuitos(p);
  const nAr = circuitosArDe(p);
  const area = parseFloat(p.areaTotal);

  $('#resumo').innerHTML = `
    <div class="res" style="--cor:var(--c-climatizacao)"><small>Climatização · quantidade de ar</small>
      <strong>${q === null ? '—' : num2.format(q)}</strong>
      <span>${q === null ? 'Informe a área de venda' : `${num0.format(p.areaVenda)} m² ÷ (57000/700) → ${equip} equipamento(s)`}</span></div>
    <div class="res" style="--cor:var(--c-prevencao)"><small>Prevenção · ocupação ${OCUPACAO}</small>
      <strong>${tipo ? nomePrevencao(tipo) : '—'}</strong>
      <span>${p.disciplinas.prevencao.classificacao !== 'auto' ? 'Definido manualmente'
        : tipo ? `${num0.format(area)} m² ${tipo === 'completo' ? '>' : '≤'} ${num0.format(limiteUF(p.uf))} m² (limite ${p.uf}, ${OCUPACAO})${limiteConfirmado(p.uf) ? '' : ' · <b class="aviso">limite a confirmar</b>'}` : 'Informe área total e UF'}</span></div>
    <div class="res" style="--cor:var(--c-eletrico)"><small>Elétrico · quadro de circuitos</small>
      <strong>${circ.length} circuitos</strong>
      <span>${nAr} circuito(s) de ar${p.disciplinas.eletrico.circuitosAr === '' ? ' (da climatização)' : ''}</span></div>`;

  const inpEquip = $('[data-auto="equipamentos"]');
  if (inpEquip) inpEquip.placeholder = q === null ? 'auto' : `auto: ${q === null ? '' : Math.ceil(q)}`;
  const inpCirc = $('[data-auto="circuitosAr"]');
  if (inpCirc) inpCirc.placeholder = `auto: ${equip}`;

  $$('[data-so]').forEach(li => { li.hidden = li.dataset.so !== tipo; });

  const tb = $('#tbody-circuitos');
  if (tb) {
    tb.innerHTML = circ.map(c => `<tr${/^AR\s/.test(c[1]) ? ' class="ar"' : ''}>${c.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('');
    $('#tit-circuitos').textContent = `Quadro de circuitos (${circ.length})`;
  }

  const drive = urlSegura(p.drive);
  $('#lnk-drive').hidden = !drive;
  if (drive) $('#lnk-drive').href = drive;
}

function renderHistorico() {
  $('#hist-lista').innerHTML = editando.historico.length
    ? [...editando.historico].reverse().map(h => `<li><time>${fmtData(h.data)} ${h.data.slice(11, 16)}</time>${esc(h.texto)}</li>`).join('')
    : '<li class="hint" style="text-align:left">Sem registros ainda.</li>';
}

function registrar(p, texto) {
  p.historico.push({ data: isoLocal().slice(0, 16), texto });
}

function salvarProjeto() {
  lerFormulario();
  const idx = state.projetos.findIndex(p => p.id === editando.id);
  const antigo = idx >= 0 ? state.projetos[idx] : null;

  DISC_IDS.forEach(id => ajustarEtapa(editando, id));

  if (antigo) {
    if (!antigo.layout && editando.layout) registrar(editando, `Layout recebido em ${fmtData(editando.layout)}`);
    DISC_IDS.forEach(id => {
      const a = antigo.disciplinas[id], n = editando.disciplinas[id];
      if (a.ativa && n.ativa && a.etapa !== n.etapa) registrar(editando, `${DISCIPLINAS[id].nome}: etapa alterada para “${ETAPAS[n.etapa].nome}”`);
      if (a.ativa !== n.ativa) registrar(editando, `${DISCIPLINAS[id].nome}: ${n.ativa ? 'incluída' : 'removida'} do escopo`);
      if (n.feitos.includes('envio') && !a.feitos.includes('envio')) registrar(editando, `${DISCIPLINAS[id].nome}: PDF enviado no grupo e no Drive`);
    });
    if (antigo.status !== editando.status) registrar(editando, `Status do projeto: ${editando.status}`);
    state.projetos[idx] = editando;
  } else {
    registrar(editando, 'Projeto cadastrado' + (editando.layout ? ` (layout recebido em ${fmtData(editando.layout)})` : ''));
    state.projetos.push(editando);
  }
  salvar();
  $('#dlg').close();
  toast('Projeto salvo.');
  render();
}

function circuitosTabela() {
  return [['Circuito', 'Descrição', 'Esquema', 'Método de inst.', 'Tensão (V)', 'Seção (mm²)', 'Disj. (A)'], ...gerarCircuitos(editando)];
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

  $('#form-projeto').addEventListener('input', atualizarCalculos);
  $('#form-projeto').addEventListener('change', e => {
    if (e.target.dataset.f === 'ativa') {
      const painel = e.target.closest('.disc-panel');
      painel.classList.toggle('off', !e.target.checked);
      $(`[data-tab="${painel.dataset.panel}"] .disc-dot`).style.background = e.target.checked ? DISCIPLINAS[painel.dataset.panel].cor : '#cfd5df';
    }
    atualizarCalculos();
  });

  $('#disc-panels').addEventListener('click', e => {
    if (e.target.id === 'btn-copiar-circ') {
      const txt = circuitosTabela().map(l => l.join('\t')).join('\n');
      navigator.clipboard?.writeText(txt).then(() => toast('Tabela copiada. Cole no Excel ou no AutoCAD.'), () => toast('Não foi possível copiar.'));
    }
    if (e.target.id === 'btn-csv-circ') {
      baixar(`circuitos-${(editando.codigo || editando.nome || 'projeto').replace(/[^\w-]+/g, '_')}.csv`, csv(circuitosTabela()), 'text/csv;charset=utf-8');
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
  const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return isoLocal(x).slice(0, 10); };
  const todos = id => DISCIPLINAS[id].passos.map(s => s.id);
  const disc = (etapa, prazo, feitos = []) => ({ ...novaDisciplina(true), etapa, prazo: d(prazo), responsavel: 'Hugo', feitos });
  const off = () => novaDisciplina(false);
  return [
    { codigo: 'GZ-26-001', nome: 'Loja nova – Av. Brasil', cidade: 'Campo Grande', uf: 'MS', tipo: 'Loja nova', areaTotal: 1250, areaVenda: 980,
      layout: d(-6), prazoFinal: d(25), contato: 'Eng. obras Gazin',
      disciplinas: { climatizacao: disc(2, 2, ['calculo', 'distribuicao']), prevencao: disc(2, 9, ['norma']), eletrico: disc(1, 16) } },
    { codigo: 'GZ-26-002', nome: 'Reforma loja 218', cidade: 'Cuiabá', uf: 'MT', tipo: 'Reforma de loja', areaTotal: 620, areaVenda: 540,
      layout: d(-15), prazoFinal: d(5),
      disciplinas: { climatizacao: disc(4, -6, todos('climatizacao')), prevencao: disc(2, -1, ['norma', 'sinalizacao', 'iluminacao']),
        eletrico: disc(2, 4, ['distribuicao', 'caixa', 'leg-condutos']) } },
    { codigo: 'GZ-26-003', nome: 'Loja nova – Centro', cidade: 'Porto Velho', uf: 'RO', tipo: 'Loja nova', areaTotal: 1480, areaVenda: 1150,
      prazoFinal: d(45),
      disciplinas: { climatizacao: disc(0, 12), prevencao: disc(0, 18), eletrico: disc(0, 25) } },
    { codigo: 'GZ-26-004', nome: 'Ampliação loja 145', cidade: 'Goiânia', uf: 'GO', tipo: 'Ampliação', areaTotal: 900, areaVenda: 700,
      layout: d(-20), prazoFinal: d(3),
      disciplinas: { climatizacao: disc(4, -10, todos('climatizacao')), prevencao: disc(3, 2, todos('prevencao')),
        eletrico: disc(2, 3, todos('eletrico').slice(0, 8)) } }
  ].map(p => {
    const n = normalizarProjeto(p);
    DISC_IDS.forEach(id => ajustarEtapa(n, id));
    registrar(n, 'Projeto de exemplo');
    return n;
  });
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
  $('#btn-salvar-limites').addEventListener('click', () => {
    state.config.limites = {};
    $$('[data-uf]').forEach(inp => { if (parseFloat(inp.value) > 0) state.config.limites[inp.dataset.uf] = parseFloat(inp.value); });
    salvar();
    toast('Limites por estado salvos.');
    renderDados();
  });
  $('#btn-salvar-circuitos').addEventListener('click', () => {
    state.config.circuitos = $('#inp-circuitos').value.trim();
    salvar();
    toast('Tabela de circuitos salva.');
  });
  $('#btn-restaurar-circuitos').addEventListener('click', () => {
    $('#inp-circuitos').value = CIRCUITOS_PADRAO;
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
    state = { ...estadoVazio(), equipe: state.equipe, config: state.config };
    salvar();
    toast('Projetos apagados.');
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
