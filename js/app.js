// ============================================================================
// URNA ELETRÔNICA - PASCOM SÃO JOSÉ
// Votação em 2 etapas: Coordenação e Vice-coordenação
// ============================================================================

// Configuração
let CONFIG = window.CONFIG || {
  BACKEND_URL: '',
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

// Elementos DOM
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
// Confirmação final
// --------------------------------------------------------------------------
async function confirmarVoto() {
  if (!candidatoCoordenacao || !candidatoVice) return;

  const voto = {
    coordenacao: candidatoCoordenacao.numero,
    coordenacaoNome: candidatoCoordenacao.nome,
    vice: candidatoVice.numero,
    viceNome: candidatoVice.nome,
    timestamp: new Date().toISOString(),
  };

  console.log('Confirmando voto:', voto);

  try {
    if (CONFIG.BACKEND_URL) {
      const resposta = await fetch(CONFIG.BACKEND_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voto),
      });
      if (!resposta.ok) throw new Error('Erro ao enviar voto');
    } else {
      const votos = JSON.parse(localStorage.getItem('urna_votos_demo') || '[]');
      votos.push(voto);
      localStorage.setItem('urna_votos_demo', JSON.stringify(votos));
      console.log('Voto salvo em localStorage (modo demo)');
    }

    mostrarResultadoFinal(true);
  } catch (erro) {
    console.error(erro);
    alert('Erro ao computar o voto. Tente novamente.');
    mostrarTela(telaConfirmacao);
  }
}

// --------------------------------------------------------------------------
// Telas
// --------------------------------------------------------------------------
function mostrarTela(tela) {
  [telaCoordenacao, telaVice, telaConfirmacao, telaFim].forEach((t) => {
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
