// NutriVida - JavaScript do frontend
// Se a porta do backend mudar, altere esta constante.
const API = 'http://localhost:3000/api';

const categorias = {
  refeicoes: { titulo: 'Refeições', descricao: 'Opções para suas principais refeições.' },
  lanches: { titulo: 'Lanches', descricao: 'Pequenas refeições para o seu dia.' },
  vitaminas: { titulo: 'Vitaminas', descricao: 'Bebidas nutritivas e refrescantes.' }
};
const nomesRefeicoes = {
  1: 'Café da manhã',
  2: 'Almoço',
  3: 'Lanche',
  4: 'Jantar'
};

let usuario = JSON.parse(localStorage.getItem('nutrivida_usuario') || 'null');
let categoriaAtual = 'refeicoes';
let paginaAtual = 1;
let alimentos = [];
let favoritos = [];
let plano = [];
let alimentoEmAvaliacao = null;
let modoAuth = 'login';
let toastTimer;

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || data.message || 'Não foi possível concluir a operação.');
  return data;
}

function mostrarToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function exigirLogin() {
  if (usuario) return true;
  abrirAuth('login');
  return false;
}

function abrirAuth(mode = 'login') {
  mudarModoAuth(mode);
  $('authError').textContent = '';
  $('authModal').classList.remove('hidden');
  $('authModal').setAttribute('aria-hidden', 'false');
  $('authName').focus();
}
function fecharAuth() {
  $('authModal').classList.add('hidden');
  $('authModal').setAttribute('aria-hidden', 'true');
}
function mudarModoAuth(mode) {
  modoAuth = mode;
  document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
  $('authSubmit').textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
  $('authTitle').textContent = mode === 'login' ? 'Acesse o NutriVida' : 'Crie sua conta';
  $('authPassword').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('authError').textContent = '';
}

function atualizarUsuario() {
  const logado = Boolean(usuario);
  $('loginButton').classList.toggle('hidden', logado);
  $('userArea').classList.toggle('hidden', !logado);
  if (logado) {
    $('userNameLabel').textContent = usuario.nome;
    $('userAvatar').textContent = usuario.nome.charAt(0).toUpperCase();
    $('welcomeTitle').textContent = `Olá, ${usuario.nome}! 👋`;
    $('welcomeText').textContent = 'Seu plano alimentar está esperando por você.';
  } else {
    $('welcomeTitle').textContent = 'Olá! 👋';
    $('welcomeText').textContent = 'Entre na sua conta para acompanhar seu plano alimentar.';
  }
}

async function carregarCatalogo() {
  $('foodGrid').innerHTML = '<div class="loading-card">Carregando alimentos...</div>';
  try {
    alimentos = await api('/alimentos');
    await carregarDadosUsuario();
    renderizarCatalogo();
  } catch (error) {
    $('foodGrid').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}<br>Confira se o backend está rodando.</div>`;
    $('resultsLabel').textContent = 'Sem conexão';
  }
}

async function carregarDadosUsuario() {
  if (!usuario) {
    favoritos = [];
    plano = [];
    atualizarTotais();
    return;
  }
  try {
    const [fav, meuPlano] = await Promise.all([
      api(`/favoritos/${usuario.id}`),
      api(`/plano/${usuario.id}`)
    ]);
    favoritos = fav;
    plano = meuPlano;
  } catch (error) {
    console.error(error);
    favoritos = [];
    plano = [];
  }
  atualizarTotais();
}

function atualizarTotais() {
  const porcoes = plano.reduce((total, item) => total + Number(item.quantidade || 0), 0);
  const calorias = plano.reduce((total, item) => total + Number(item.calorias || 0) * Number(item.quantidade || 0), 0);
  $('totalRefeicoes').textContent = porcoes;
  $('totalCalorias').textContent = `${calorias.toLocaleString('pt-BR')} kcal`;
}

function renderizarCatalogo() {
  const info = categorias[categoriaAtual];
  $('categoryTitle').textContent = info.titulo;
  $('catalogDescription').textContent = info.descricao;
  document.querySelectorAll('.category-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.category === categoriaAtual));

  const filtrados = alimentos.filter(item => item.categoria === categoriaAtual);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / 3));
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  const inicio = (paginaAtual - 1) * 3;
  const pagina = filtrados.slice(inicio, inicio + 3);
  $('resultsLabel').textContent = `${filtrados.length} alimento(s)`;
  $('foodGrid').innerHTML = pagina.length ? pagina.map(criarCardAlimento).join('') : '<div class="empty-state">Nenhum alimento cadastrado nesta categoria.</div>';
  renderizarPaginacao(totalPaginas);
}

function criarCardAlimento(item) {
  const favoritado = favoritos.some(f => Number(f.id) === Number(item.id));
  const qtdAvaliacoes = Number(item.total_avaliacoes || item.quantidade_avaliacoes || 0);
  return `
    <article class="food-card">
      <div class="food-top">
        <div class="food-emoji">${escapeHtml(item.emoji || '🥗')}</div>
        <span class="food-category">${categorias[item.categoria]?.titulo || 'Alimento'}</span>
      </div>
      <h3>${escapeHtml(item.nome)}</h3>
      <p class="food-description">${escapeHtml(item.descricao || 'Uma opção para compor sua alimentação.')}</p>
      <div class="food-meta">
        <span>⏱ ${escapeHtml(item.tempo_preparo ?? '—')} min</span>
        <span>🔥 ${escapeHtml(item.calorias ?? '—')} kcal</span>
        <span>Qtd. ref.: ${escapeHtml(item.quantidade_ref ?? 1)}</span>
      </div>
      <div class="nutrients">
        <div class="nutrient"><strong>${escapeHtml(item.proteinas ?? '—')}g</strong><small>Proteínas</small></div>
        <div class="nutrient"><strong>${escapeHtml(item.carboidratos ?? '—')}g</strong><small>Carboidratos</small></div>
        <div class="nutrient"><strong>${escapeHtml(item.gorduras ?? '—')}g</strong><small>Gorduras</small></div>
      </div>
      <div class="food-actions">
        <button class="favorite-button ${favoritado ? 'is-favorite' : ''}" onclick="alternarFavorito(${Number(item.id)})">${favoritado ? '♥ Favoritado' : '♡ Favoritar'}</button>
        <button onclick="abrirAvaliacoes(${Number(item.id)})">☆ Avaliar</button>
        <button class="add-button" onclick="adicionarAoPlano(${Number(item.id)})">＋ Adicionar ao plano</button>
      </div>
      <div class="review-count">✦ ${qtdAvaliacoes} avaliação(ões)</div>
    </article>`;
}

function renderizarPaginacao(total) {
  const nav = $('pagination');
  if (total <= 1) { nav.innerHTML = ''; return; }
  let html = `<button ${paginaAtual === 1 ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual - 1})">‹</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="${i === paginaAtual ? 'active' : ''}" onclick="irParaPagina(${i})">${i}</button>`;
  }
  html += `<button ${paginaAtual === total ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual + 1})">›</button>`;
  nav.innerHTML = html;
}
function irParaPagina(numero) { paginaAtual = numero; renderizarCatalogo(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

async function alternarFavorito(alimentoId) {
  if (!exigirLogin()) return;
  const existe = favoritos.some(item => Number(item.id) === Number(alimentoId));
  try {
    if (existe) {
      await api('/favoritos', { method: 'DELETE', body: JSON.stringify({ usuarioId: usuario.id, alimentoId }) });
      mostrarToast('Alimento removido dos favoritos.');
    } else {
      await api('/favoritos', { method: 'POST', body: JSON.stringify({ usuarioId: usuario.id, alimentoId }) });
      mostrarToast('Alimento adicionado aos favoritos!');
    }
    await carregarDadosUsuario();
    renderizarCatalogo();
  } catch (error) { mostrarToast(error.message); }
}

async function adicionarAoPlano(alimentoId) {
  if (!exigirLogin()) return;
  const escolha = prompt('Escolha a refeição:\n1 - Café da manhã\n2 - Almoço\n3 - Lanche\n4 - Jantar');
  if (escolha === null) return;
  const refeicao = Number(escolha);
  if (![1, 2, 3, 4].includes(refeicao)) { mostrarToast('Escolha um número de 1 a 4.'); return; }
  const quantidadeTexto = prompt('Quantidade (1 a 20):', '1');
  if (quantidadeTexto === null) return;
  const quantidade = Number(quantidadeTexto);
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) { mostrarToast('Informe uma quantidade inteira de 1 a 20.'); return; }
  try {
    await api('/plano', { method: 'POST', body: JSON.stringify({ usuarioId: usuario.id, alimentoId, refeicao, quantidade }) });
    await carregarDadosUsuario();
    renderizarCatalogo();
    mostrarToast('Alimento adicionado ao seu plano!');
  } catch (error) { mostrarToast(error.message); }
}

async function abrirResumo() {
  if (!exigirLogin()) return;
  await carregarDadosUsuario();
  $('catalogView').classList.add('hidden');
  $('summaryView').classList.remove('hidden');
  renderizarResumo();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderizarResumo() {
  const container = $('planSummary');
  if (!plano.length) {
    container.innerHTML = '<div class="empty-state">Seu plano ainda está vazio. Volte ao catálogo e adicione alimentos.</div>';
  } else {
    container.innerHTML = [1,2,3,4].map(refeicao => {
      const itens = plano.filter(item => Number(item.refeicao) === refeicao);
      if (!itens.length) return '';
      const subtotal = itens.reduce((soma, item) => soma + Number(item.calorias || 0) * Number(item.quantidade || 0), 0);
      return `<section class="plan-group"><h3>${nomesRefeicoes[refeicao]} <span>· ${subtotal} kcal</span></h3>
        ${itens.map(item => `<div class="plan-row"><div><strong>${escapeHtml(item.emoji || '🥗')} ${escapeHtml(item.nome)}</strong><small>${item.quantidade} porção(ões) · ${Number(item.calorias || 0) * Number(item.quantidade || 0)} kcal · P ${Number(item.proteinas || 0) * Number(item.quantidade || 0)}g · C ${Number(item.carboidratos || 0) * Number(item.quantidade || 0)}g · G ${Number(item.gorduras || 0) * Number(item.quantidade || 0)}g</small></div><button class="remove-plan" onclick="removerDoPlano(${Number(item.id)})">×</button></div>`).join('')}
      </section>`;
    }).join('');
  }
  const porcoes = plano.reduce((s, item) => s + Number(item.quantidade || 0), 0);
  const calorias = plano.reduce((s, item) => s + Number(item.calorias || 0) * Number(item.quantidade || 0), 0);
  $('summaryCalories').textContent = `${calorias} kcal`;
  $('summaryPortions').textContent = porcoes;
}

async function removerDoPlano(id) {
  try {
    await api(`/plano/${id}`, { method: 'DELETE', body: JSON.stringify({ usuarioId: usuario.id }) });
    await carregarDadosUsuario();
    renderizarResumo();
    mostrarToast('Item removido do plano.');
  } catch (error) { mostrarToast(error.message); }
}

async function abrirAvaliacoes(alimentoId) {
  if (!exigirLogin()) return;
  alimentoEmAvaliacao = alimentos.find(item => Number(item.id) === Number(alimentoId));
  $('reviewTitle').textContent = `Avaliações — ${alimentoEmAvaliacao?.nome || 'Alimento'}`;
  $('reviewError').textContent = '';
  $('reviewForm').reset();
  $('reviewModal').classList.remove('hidden');
  try {
    const avaliacoes = await api(`/avaliacoes/${alimentoId}`);
    $('reviewList').innerHTML = avaliacoes.length ? avaliacoes.map(a => `
      <article class="review-item"><strong>${escapeHtml(a.nome || 'Usuário')} · ${'★'.repeat(Number(a.nota))}${'☆'.repeat(5 - Number(a.nota))}</strong>
      <p>${escapeHtml(a.comentario)}</p></article>`).join('') : '<p class="review-empty">Este alimento ainda não tem avaliações. Seja o primeiro!</p>';
  } catch (error) { $('reviewList').innerHTML = `<p class="review-empty">${escapeHtml(error.message)}</p>`; }
}

async function enviarAuth(event) {
  event.preventDefault();
  const nome = $('authName').value.trim();
  const senha = $('authPassword').value;
  if (nome.length < 3 || nome.length > 40 || senha.length < 6 || senha.length > 128) {
    $('authError').textContent = 'Nome deve ter 3 a 40 caracteres e senha de 6 a 128.';
    return;
  }
  const endpoint = modoAuth === 'login' ? '/usuarios/login' : '/usuarios/cadastro';
  try {
    const dados = await api(endpoint, { method: 'POST', body: JSON.stringify({ nome, senha }) });
    if (modoAuth === 'register') {
      mostrarToast('Conta criada! Agora entre com seus dados.');
      mudarModoAuth('login');
      $('authPassword').value = '';
      return;
    }
    usuario = dados.usuario;
    localStorage.setItem('nutrivida_usuario', JSON.stringify(usuario));
    // O token identifica a sessão no navegador. As rotas atuais ainda não validam esse token.
    localStorage.setItem('nutrivida_token', dados.token);
    fecharAuth();
    atualizarUsuario();
    await carregarDadosUsuario();
    renderizarCatalogo();
    mostrarToast('Login realizado com sucesso!');
  } catch (error) { $('authError').textContent = error.message === 'Não foi possível concluir a operação.' ? 'Nome ou senha inválidos.' : error.message; }
}

async function enviarAvaliacao(event) {
  event.preventDefault();
  if (!exigirLogin() || !alimentoEmAvaliacao) return;
  const nota = Number($('reviewRating').value);
  const comentario = $('reviewComment').value.trim();
  if (!Number.isInteger(nota) || nota < 1 || nota > 5 || comentario.length < 3 || comentario.length > 500) {
    $('reviewError').textContent = 'Escolha uma nota e escreva um comentário de 3 a 500 caracteres.';
    return;
  }
  try {
    await api('/avaliacoes', { method: 'POST', body: JSON.stringify({ usuarioId: usuario.id, alimentoId: alimentoEmAvaliacao.id, nota, comentario }) });
    $('reviewModal').classList.add('hidden');
    mostrarToast('Avaliação enviada!');
    await carregarCatalogo();
  } catch (error) { $('reviewError').textContent = error.message; }
}

function sair() {
  // A API de logout ainda não foi criada. Remove a identificação local nesta versão.
  usuario = null;
  localStorage.removeItem('nutrivida_usuario');
  localStorage.removeItem('nutrivida_token');
  favoritos = [];
  plano = [];
  atualizarUsuario();
  atualizarTotais();
  renderizarCatalogo();
  mostrarToast('Você saiu da sua conta.');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

document.querySelectorAll('.category-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    categoriaAtual = tab.dataset.category;
    paginaAtual = 1;
    renderizarCatalogo();
  });
});
document.querySelectorAll('.auth-tab').forEach(tab => tab.addEventListener('click', () => mudarModoAuth(tab.dataset.mode)));
$('loginButton').addEventListener('click', () => abrirAuth('login'));
$('closeAuth').addEventListener('click', fecharAuth);
$('authModal').addEventListener('click', event => { if (event.target === $('authModal')) fecharAuth(); });
$('authForm').addEventListener('submit', enviarAuth);
$('summaryButton').addEventListener('click', abrirResumo);
$('backCatalogButton').addEventListener('click', () => { $('summaryView').classList.add('hidden'); $('catalogView').classList.remove('hidden'); });
$('finishButton').addEventListener('click', () => mostrarToast('Plano salvo na sua conta!'));
$('logoutButton').addEventListener('click', sair);
$('closeReview').addEventListener('click', () => $('reviewModal').classList.add('hidden'));
$('reviewModal').addEventListener('click', event => { if (event.target === $('reviewModal')) $('reviewModal').classList.add('hidden'); });
$('reviewForm').addEventListener('submit', enviarAvaliacao);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { fecharAuth(); $('reviewModal').classList.add('hidden'); }
});

atualizarUsuario();
carregarCatalogo();
