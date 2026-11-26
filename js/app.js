// ============================================================================
// URNA ELETRÔNICA - PASCOM SÃO JOSÉ
// Votação em 2 etapas: Coordenação e Vice-coordenação
// ============================================================================

// Configuração
let CONFIG = window.CONFIG || {
  FIREBASE: null,
  ADMIN_SENHA: 'pascom2026',
  ELEICAO: 'Coordenação PASCOM São José 2026',
  CARGO: 'Coordenação da PASCOM',
  ARQUIVO_CANDIDATOS: 'data/candidatos.json',
  ARQUIVO_VOTOS: 'votos.json',
};

// Candidatos embutidos (fallback)
const CANDIDATOS_PADRAO = [
  { numero: '12', nome: 'Juliana', foto: 'assets/juliana.jpeg', bio: 'Candidata à Coordenação' },
  { numero: '23', nome: 'Ana Letícia', foto: 'assets/leticia.jpeg', bio: 'Candidata à Coordenação' },
  { numero: '34', nome: 'Pâmela', foto: 'assets/pamela.jpeg', bio: 'Candidata à Coordenação' },
  { numero: '45', nome: 'Dudu', foto: 'assets/dudu.jpeg', bio: 'Candidato à Coordenação' },
  { numero: '0', nome: 'Voto em Branco', foto: '', bio: 'Não selecione nenhum candidato' }
];

let candidatos = [];
let candidatoCoordenacao = null;
let candidatoVice = null;
let telefoneAtual = null; // telefone do eleitor (voto único + cadastro)

// Elementos DOM
const telaEleitor = document.getElementById('tela-eleitor');
const inputEleitor = document.getElementById('input-eleitor');
const btnEntrarEleitor = document.getElementById('btn-entrar-eleitor');
const msgEleitor = document.getElementById('msg-eleitor');

const telaCoordenacao = document.getElementById('tela-coordenacao');
const telaVice = document.getElementById('tela-vice');
const telaConfirmacao = document.getElementById('tela-confirmacao');
const telaFim = document.getElementById('tela-fim');

const listaCoordenacao = document.getElementById('candidatos-coordenacao');
const listaVice = document.getElementById('candidatos-vice');

const btnConfirmarCoordenacao = document.getElementById('btn-confirmar-coordenacao');
const btnConfirmarVice = document.getElementById('btn-confirmar-vice');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnCorrecao = document.getElementById('btn-correcao');

const resumoVoto = document.getElementById('voto-resumo');
const tituloFim = document.getElementById('titulo-fim');
const msgFim = document.getElementById('msg-fim');

// --------------------------------------------------------------------------
// Inicialização
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Urna iniciada (2 etapas)');

  try {
    await carregarCandidatos();
  } catch (e) {
    console.warn('Fetch falhou, usando candidatos embutidos:', e.message);
    candidatos = CANDIDATOS_PADRAO;
  }

  renderizarEtapaCoordenacao();

  if (btnEntrarEleitor) {
    btnEntrarEleitor.addEventListener('click', entrarComoEleitor);
  }
  if (inputEleitor) {
    inputEleitor.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') entrarComoEleitor();
    });
  }
  if (btnConfirmarCoordenacao) {
    btnConfirmarCoordenacao.addEventListener('click', irParaVice);
  }
  if (btnConfirmarVice) {
    btnConfirmarVice.addEventListener('click', irParaConfirmacao);
  }
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', confirmarVoto);
  }
  if (btnCorrecao) {
    btnCorrecao.addEventListener('click', () => {
      // Volta para a etapa 1
      candidatoCoordenacao = null;
      candidatoVice = null;
      // mantém o telefone do eleitor; só limpa a escolha de candidatos
      if (btnConfirmarCoordenacao) { btnConfirmarCoordenacao.disabled = true; }
      if (btnConfirmarVice) { btnConfirmarVice.disabled = true; }
      renderizarEtapaCoordenacao();
      renderizarEtapaVice();
      mostrarTela(telaCoordenacao);
    });
  }
});

// --------------------------------------------------------------------------
// Carregar candidatos
// --------------------------------------------------------------------------
async function carregarCandidatos() {
  const resposta = await fetch(CONFIG.ARQUIVO_CANDIDATOS + '?t=' + Date.now());
  if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
  candidatos = await resposta.json();
}

// --------------------------------------------------------------------------
// Renderização dos cards
// --------------------------------------------------------------------------
function criarCardCandidato(c, onSelect) {
  const ehBranco = c.numero === '0';

  const card = document.createElement('div');
  card.className = 'candidato-card';
  card.dataset.numero = c.numero;
  card.style.cursor = 'pointer';

  if (ehBranco) {
    card.classList.add('branco');
    card.style.borderStyle = 'dashed';
    card.style.background = '#F8F9FA';
  }

  const numeroEl = document.createElement('span');
  numeroEl.className = 'numero';
  numeroEl.textContent = c.numero;
  card.appendChild(numeroEl);

  if (c.foto && !ehBranco) {
    const img = document.createElement('img');
    img.src = c.foto;
    img.alt = c.nome;
    img.style.cssText = 'width:110px;height:110px;border-radius:50%;object-fit:cover;margin:0 auto 14px;display:block;box-shadow:0 4px 10px rgba(0,0,0,0.15);';
    img.onerror = function () {
      this.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'width:110px;height:110px;border-radius:50%;background:#e2e8ea;margin:0 auto 14px;';
      card.insertBefore(placeholder, this);
      this.remove();
    };
    card.appendChild(img);
  }

  const nomeEl = document.createElement('h3');
  nomeEl.textContent = c.nome;
  nomeEl.style.cssText = 'font-size:1.25rem;margin-bottom:6px;color:#2C3E50;';
  card.appendChild(nomeEl);

  const bioEl = document.createElement('p');
  bioEl.textContent = c.bio || '';
  bioEl.style.cssText = 'font-size:0.95rem;color:#555;margin:4px 0;';
  card.appendChild(bioEl);

  card.addEventListener('click', () => onSelect(c));

  return card;
}

function destacarSelecionado(container, numero) {
  container.querySelectorAll('.candidato-card').forEach((el) => {
    const isSelected = el.dataset.numero === numero;
    el.classList.toggle('selecionado', isSelected);
    if (isSelected) {
      el.style.borderColor = '#E8A33D';
      el.style.background = '#FBF1E0';
      el.style.boxShadow = '0 0 0 5px rgba(232,163,61,0.25)';
    } else {
      el.style.borderColor = '';
      el.style.background = '';
      el.style.boxShadow = '';
    }
  });
}

// --------------------------------------------------------------------------
// Etapa 1: Coordenação
// --------------------------------------------------------------------------
function renderizarEtapaCoordenacao() {
  if (!listaCoordenacao) return;
  listaCoordenacao.innerHTML = '';

  candidatos.forEach((c) => {
    listaCoordenacao.appendChild(criarCardCandidato(c, selecionarCoordenacao));
  });
}

function selecionarCoordenacao(c) {
  candidatoCoordenacao = c;
  destacarSelecionado(listaCoordenacao, c.numero);

  if (btnConfirmarCoordenacao) {
    btnConfirmarCoordenacao.disabled = false;
    btnConfirmarCoordenacao.textContent = 'Confirmar ' + c.nome + ' (' + c.numero + ')';
    btnConfirmarCoordenacao.style.opacity = '1';
  }
}

function irParaVice() {
  if (!candidatoCoordenacao) {
    alert('Escolha o candidato para Coordenação primeiro!');
    return;
  }
  renderizarEtapaVice();
  mostrarTela(telaVice);
}

// --------------------------------------------------------------------------
// Etapa 2: Vice-coordenação
// --------------------------------------------------------------------------
function renderizarEtapaVice() {
  if (!listaVice) return;
  listaVice.innerHTML = '';

  candidatos.forEach((c) => {
    // Não permite votar no mesmo candidato escolhido para coordenação
    // (exceto o voto em branco)
    if (candidatoCoordenacao && c.numero === candidatoCoordenacao.numero && c.numero !== '0') {
      return;
    }

    listaVice.appendChild(criarCardCandidato(c, selecionarVice));
  });
}

function selecionarVice(c) {
  candidatoVice = c;
  destacarSelecionado(listaVice, c.numero);

  if (btnConfirmarVice) {
    btnConfirmarVice.disabled = false;
    btnConfirmarVice.textContent = 'Confirmar ' + c.nome + ' (' + c.numero + ')';
    btnConfirmarVice.style.opacity = '1';
  }
}

function irParaConfirmacao() {
  if (!candidatoVice) {
    alert('Escolha o candidato para Vice-coordenação!');
    return;
  }

  if (resumoVoto) {
    resumoVoto.innerHTML = '';

    const titulo = document.createElement('h3');
    titulo.textContent = 'Resumo dos seus votos';
    titulo.style.cssText = 'margin-bottom:16px;color:#0E4B3A;font-size:1.25rem;text-align:center;';
    resumoVoto.appendChild(titulo);

    resumoVoto.appendChild(criarLinhaResumo('1º Voto — Coordenação:', candidatoCoordenacao.nome + ' (' + candidatoCoordenacao.numero + ')'));
    resumoVoto.appendChild(criarLinhaResumo('2º Voto — Vice:', candidatoVice.nome + ' (' + candidatoVice.numero + ')', true));
  }

  mostrarTela(telaConfirmacao);
}

function criarLinhaResumo(label, valor, ultima) {
  const linha = document.createElement('div');
  linha.className = 'resumo-item';
  linha.style.cssText = 'display:flex;justify-content:space-between;padding:12px 0;align-items:center;font-size:1rem;gap:12px;' +
    (ultima ? 'border-bottom:none;' : 'border-bottom:2px solid #E2E8EA;');

  const labelEl = document.createElement('span');
  labelEl.textContent = label;
  labelEl.style.cssText = 'color:#2C3E50;font-weight:700;';

  const valorEl = document.createElement('span');
  valorEl.className = 'valor';
  valorEl.textContent = valor;
  valorEl.style.cssText = 'color:#0E4B3A;font-weight:800;font-size:1.05rem;text-align:right;';

  linha.appendChild(labelEl);
  linha.appendChild(valorEl);
  return linha;
}

// --------------------------------------------------------------------------
// Identificação do eleitor + voto único
// --------------------------------------------------------------------------
// "configurado" = usuário preencheu FIREBASE (quer usar Firebase, não modo demo)
function firebaseConfigurado() {
  const fb = CONFIG.FIREBASE;
  return !!(fb && fb.apiKey && fb.projectId);
}

// "usarFirebase" = configurado E conectado com sucesso
function usarFirebase() {
  return !!(window.UrnaFirebase && window.UrnaFirebase.disponivel);
}

// Normalização do TELEFONE: só dígitos, remove prefixo 0, remove país 55 (BR).
// (11) 99999-9999 / 11999999999 / +55 11 99999-9999 -> 11999999999
function normalizarTelefone(valor) {
  if (valor === null || valor === undefined) return '';
  let d = String(valor).trim().replace(/\D/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (d.length >= 12 && d.indexOf('55') === 0) d = d.slice(2);
  d = d.replace(/^0+/, '');
  return d;
}

function mostrarMsgEleitor(texto, erro) {
  if (!msgEleitor) return;
  msgEleitor.textContent = texto || '';
  msgEleitor.style.color = erro ? '#C0392B' : '#27AE60';
}

// ----- Modo demonstração (sem Firebase): voto único por navegador ----------
function lerTelefonesVotaramDemo() {
  try { return JSON.parse(localStorage.getItem('urna_telefones_votaram_demo') || '[]'); }
  catch (e) { return []; }
}
function telefoneJaVotouDemo(numero) {
  const n = normalizarTelefone(numero);
  return lerTelefonesVotaramDemo().map(normalizarTelefone).indexOf(n) !== -1;
}

async function entrarComoEleitor() {
  const telefone = normalizarTelefone(inputEleitor ? inputEleitor.value : '');
  if (!telefone) { mostrarMsgEleitor('Digite o seu telefone para continuar.', true); return; }

  if (btnEntrarEleitor) btnEntrarEleitor.disabled = true;
  try {
    if (firebaseConfigurado()) {
      if (!usarFirebase()) {
        mostrarMsgEleitor('Firebase configurado, mas sem conexão. Cadastro não pode ser verificado nem voto salvo agora.', true);
        return;
      }
      // Consulta o Firestore: telefone CADASTRADO? já VOTOU? (não grava nada)
      let verificacao;
      try {
        verificacao = await window.UrnaFirebase.checarEleitor(telefone);
      } catch (e) {
        console.error('Falha ao verificar cadastro no Firebase.', e);
        if (e && e.code === 'permission-denied') {
          mostrarMsgEleitor(
            'Permissão negada no Firestore: publique as regras (firestore.rules) no Console do Firebase.',
            true
          );
        } else if (e && e.code === 'failed-precondition') {
          mostrarMsgEleitor('Firestore indisponível (índice/banco não criado). Tente novamente.', true);
        } else {
          mostrarMsgEleitor('Não foi possível verificar seu cadastro no servidor. Tente novamente.', true);
        }
        return;
      }
      if (verificacao.jaVotou) { mostrarMsgEleitor('Este telefone já votou. Não é possível votar duas vezes.', true); return; }
      if (!verificacao.cadastrado) { mostrarMsgEleitor('Este telefone não está cadastrado. Procure a organização.', true); return; }
    } else if (telefoneJaVotouDemo(telefone)) {
      mostrarMsgEleitor('Este telefone já votou. Não é possível votar duas vezes.', true);
      return;
    }

    telefoneAtual = telefone;
    mostrarMsgEleitor('', false);
    renderizarEtapaCoordenacao();
    mostrarTela(telaCoordenacao);
  } finally {
    if (btnEntrarEleitor) btnEntrarEleitor.disabled = false;
  }
}

function salvarVotoDemo(voto) {
  if (telefoneJaVotouDemo(voto.telefone)) {
    const e = new Error('eleitor_ja_votou');
    e.codigo = 'ja_votou';
    throw e;
  }
  const votos = JSON.parse(localStorage.getItem('urna_votos_demo') || '[]');
  votos.push(voto);
  localStorage.setItem('urna_votos_demo', JSON.stringify(votos));
  const telefones = lerTelefonesVotaramDemo();
  telefones.push(voto.telefone);
  localStorage.setItem('urna_telefones_votaram_demo', JSON.stringify(telefones));
  console.log('Voto salvo em localStorage (modo demo)');
}

// --------------------------------------------------------------------------
// Confirmação final
// --------------------------------------------------------------------------
async function confirmarVoto() {
  if (!candidatoCoordenacao || !candidatoVice) return;
  if (!telefoneAtual) { mostrarTela(telaEleitor); return; }

  const voto = {
    telefone: telefoneAtual,
    coordenacao: candidatoCoordenacao.numero,
    coordenacaoNome: candidatoCoordenacao.nome,
    vice: candidatoVice.numero,
    viceNome: candidatoVice.nome,
    timestamp: new Date().toISOString(),
  };

  console.log('Confirmando voto:', voto);

  if (btnConfirmar) btnConfirmar.disabled = true;
  try {
    if (firebaseConfigurado()) {
      // Firebase escolhido: NÃO cair no modo demo se não conectou.
      if (!usarFirebase()) {
        throw new Error('Firebase configurado, mas não foi possível conectar. Voto NÃO foi salvo.');
      }
      // gravação atômica + voto único; só segue se o Firestore CONFIRMAR
      await window.UrnaFirebase.votar(voto);
    } else {
      salvarVotoDemo(voto);
    }

    mostrarResultadoFinal(true);
  } catch (erro) {
    console.error(erro);
    if (erro && (erro.codigo === 'ja_votou' || erro.codigo === 'nao_cadastrado')) {
      const msg = erro.codigo === 'ja_votou'
        ? 'Este telefone já votou. Não é possível votar duas vezes.'
        : 'Este telefone não está cadastrado. Procure a organização.';
      alert(msg);
      telefoneAtual = null;
      candidatoCoordenacao = null;
      candidatoVice = null;
      if (btnConfirmarCoordenacao) { btnConfirmarCoordenacao.disabled = true; }
      if (btnConfirmarVice) { btnConfirmarVice.disabled = true; }
      renderizarEtapaCoordenacao();
      renderizarEtapaVice();
      mostrarTela(telaEleitor);
    } else {
      // NÃO mascara falha: só dizemos sucesso se o voto foi registrado.
      alert('Não foi possível confirmar que seu voto foi registrado.' +
        (erro && erro.message ? '\n' + erro.message : '') +
        '\nConfira a conexão e tente novamente.');
      mostrarTela(telaConfirmacao);
    }
  } finally {
    if (btnConfirmar) btnConfirmar.disabled = false;
  }
}

// --------------------------------------------------------------------------
// Telas
// --------------------------------------------------------------------------
function mostrarTela(tela) {
  [telaEleitor, telaCoordenacao, telaVice, telaConfirmacao, telaFim].forEach((t) => {
    if (t) t.classList.remove('active');
  });
  if (tela) tela.classList.add('active');
  console.log('Tela exibida:', tela.id);
}

function mostrarResultadoFinal(sucesso) {
  if (tituloFim) {
    tituloFim.textContent = sucesso ? 'Votos computados com sucesso!' : 'Erro';
  }
  if (msgFim) {
    msgFim.textContent = sucesso
      ? 'Obrigado por participar da votação da PASCOM São José.'
      : 'Não foi possível completar a votação.';
  }
  mostrarTela(telaFim);
}
