// ============================================================================
// URNA ELETRÔNICA - PASCOM SÃO JOSÉ
// Lógica da tela de votação
// ============================================================================

// Carrega config (se existir). Caso contrário, usa valores padrão.
let CONFIG = window.CONFIG || {
  BACKEND_URL: '',
  ADMIN_SENHA: 'pascom2026',
  ELEICAO: 'Coordenação PASCOM São José 2026',
  CARGO: 'Coordenador(a) da PASCOM',
  ARQUIVO_CANDIDATOS: 'data/candidatos.json',
  ARQUIVO_VOTOS: 'votos.json',
};

let candidatos = [];
let eleitorId = '';
let candidatoSelecionado = null;

// Elementos DOM
const telaInicial = document.getElementById('tela-inicial');
const telaVotacao = document.getElementById('tela-votacao');
const telaConfirmacao = document.getElementById('tela-confirmacao');
const telaFim = document.getElementById('tela-fim');

const inputEleitor = document.getElementById('eleitor-id');
const btnIniciar = document.getElementById('btn-iniciar');
const msgErro = document.getElementById('msg-erro');

const listaCandidatos = document.getElementById('candidatos-lista');
const btnVotar = document.getElementById('btn-votar');

const resumoVoto = document.getElementById('voto-resumo');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnCorrecao = document.getElementById('btn-correcao');

const tituloFim = document.getElementById('titulo-fim');
const msgFim = document.getElementById('msg-fim');

// --------------------------------------------------------------------------
// Inicialização
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await carregarCandidatos();

  btnIniciar.addEventListener('click', iniciarVotacao);
  btnVotar.addEventListener('click', irParaConfirmacao);
  btnConfirmar.addEventListener('click', confirmarVoto);
  btnCorrecao.addEventListener('click', () => mostrarTela(telaVotacao));

  inputEleitor.addEventListener('input', () => {
    msgErro.textContent = '';
    btnIniciar.disabled = inputEleitor.value.trim().length < 3;
  });
  btnIniciar.disabled = true;
});

// --------------------------------------------------------------------------
// Carrega lista de candidatos
// --------------------------------------------------------------------------
async function carregarCandidatos() {
  try {
    const resposta = await fetch(CONFIG.ARQUIVO_CANDIDATOS);
    if (!resposta.ok) throw new Error('Não foi possível carregar candidatos');
    candidatos = await resposta.json();
    renderizarCandidatos();
  } catch (erro) {
    console.error(erro);
    listaCandidatos.innerHTML = '<p style="color:red">Erro ao carregar candidatos.</p>';
  }
}

function renderizarCandidatos() {
  listaCandidatos.innerHTML = '';
  candidatos.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'candidato-card';
    card.dataset.numero = c.numero;

    card.innerHTML = `
      <span class="numero">${c.numero}</span>
      ${c.foto ? `<img src="${c.foto}" alt="${c.nome}">` : '<div style="width:70px;height:70px;border-radius:50%;background:#eee;margin:0 auto 8px"></div>'}
      <h3>${c.nome}</h3>
      <p>${c.bio || ''}</p>
    `;

    card.addEventListener('click', () => selecionarCandidato(c));
    listaCandidatos.appendChild(card);
  });
}

function selecionarCandidato(candidato) {
  candidatoSelecionado = candidato;
  document.querySelectorAll('.candidato-card').forEach((el) => {
    el.classList.toggle('selecionado', el.dataset.numero === candidato.numero);
  });
  btnVotar.disabled = false;
}

// --------------------------------------------------------------------------
// Fluxo de votação
// --------------------------------------------------------------------------
function iniciarVotacao() {
  eleitorId = inputEleitor.value.trim();
  if (eleitorId.length < 3) {
    msgErro.textContent = 'Digite um identificador válido (mín. 3 caracteres).';
    return;
  }

  // Verifica se eleitor já votou (modo demo: localStorage)
  if (jaVotou(eleitorId)) {
    msgErro.textContent = 'Este eleitor já realizou a votação.';
    return;
  }

  mostrarTela(telaVotacao);
}

function irParaConfirmacao() {
  if (!candidatoSelecionado) return;

  resumoVoto.innerHTML = `
    <h3>Resumo do seu voto</h3>
    <div class="resumo-item">
      <span>Eleitor:</span>
      <span class="valor">${eleitorId}</span>
    </div>
    <div class="resumo-item">
      <span>Cargo:</span>
      <span class="valor">${CONFIG.CARGO}</span>
    </div>
    <div class="resumo-item">
      <span>Candidato:</span>
      <span class="valor">${candidatoSelecionado.nome} (${candidatoSelecionado.numero})</span>
    </div>
  `;
  mostrarTela(telaConfirmacao);
}

async function confirmarVoto() {
  const voto = {
    eleitor: eleitorId,
    candidato: candidatoSelecionado.numero,
    candidatoNome: candidatoSelecionado.nome,
    timestamp: new Date().toISOString(),
  };

  try {
    if (CONFIG.BACKEND_URL) {
      // Envia para o Google Apps Script
      const resposta = await fetch(CONFIG.BACKEND_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voto),
      });
      if (!resposta.ok) throw new Error('Erro ao enviar voto');
    } else {
      // Modo demonstração: armazena localmente (não persiste no servidor)
      salvarVotoDemo(voto);
    }

    marcarJaVotou(eleitorId);
    mostrarResultadoFinal(true);
  } catch (erro) {
    console.error(erro);
    msgErro.textContent = 'Erro ao computar o voto. Tente novamente.';
    mostrarTela(telaConfirmacao);
  }
}

// --------------------------------------------------------------------------
// Telas
// --------------------------------------------------------------------------
function mostrarTela(tela) {
  [telaInicial, telaVotacao, telaConfirmacao, telaFim].forEach((t) =>
    t.classList.remove('active')
  );
  tela.classList.add('active');
}

function mostrarResultadoFinal(sucesso) {
  if (sucesso) {
    tituloFim.textContent = 'Voto computado com sucesso!';
    msgFim.textContent =
      'Obrigado por participar da votação da PASCOM São José.';
  } else {
    tituloFim.textContent = 'Erro';
    msgFim.textContent = 'Não foi possível completar a votação.';
  }
  mostrarTela(telaFim);
}

// --------------------------------------------------------------------------
// Controle de voto duplicado (modo demo)
// --------------------------------------------------------------------------
function jaVotou(id) {
  const jaVotaram = JSON.parse(localStorage.getItem('urna_votaram') || '[]');
  return jaVotaram.includes(id);
}

function marcarJaVotou(id) {
  const jaVotaram = JSON.parse(localStorage.getItem('urna_votaram') || '[]');
  jaVotaram.push(id);
  localStorage.setItem('urna_votaram', JSON.stringify(jaVotaram));
}

function salvarVotoDemo(voto) {
  const votos = JSON.parse(localStorage.getItem('urna_votos_demo') || '[]');
  votos.push(voto);
  localStorage.setItem('urna_votos_demo', JSON.stringify(votos));
}
