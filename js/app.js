// ============================================================================
// URNA ELETRÔNICA - PASCOM SÃO JOSÉ
// ============================================================================

// Configuração padrão (fallback se config.js não carregar)
let CONFIG = {
  BACKEND_URL: '',
  ADMIN_SENHA: 'pascom2026',
  ELEICAO: 'Coordenação PASCOM São José 2026',
  CARGO: 'Coordenador(a) da PASCOM',
  ARQUIVO_CANDIDATOS: 'data/candidatos.json',
  ARQUIVO_VOTOS: 'votos.json',
};

// Usa CONFIG global se existir (carregado por config.js)
if (typeof window !== 'undefined' && window.CONFIG) {
  CONFIG = window.CONFIG;
}

let candidatos = [];
let candidatoSelecionado = null;

// Elementos DOM
const telaInicial = document.getElementById('tela-inicial');
const telaConfirmacao = document.getElementById('tela-confirmacao');
const telaFim = document.getElementById('tela-fim');

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
  try {
    await carregarCandidatos();
  } catch (e) {
    console.error('Erro ao inicializar:', e);
    listaCandidatos.innerHTML = '<div style="padding:20px;text-align:center;color:#dc3545;">Erro ao carregar candidatos. Verifique sua conex&atilde;o.</div>';
  }

  btnVotar.addEventListener('click', irParaConfirmacao);
  btnConfirmar.addEventListener('click', confirmarVoto);
  btnCorrecao.addEventListener('click', () => mostrarTela(telaInicial));
});

// --------------------------------------------------------------------------
// Carrega lista de candidatos
// --------------------------------------------------------------------------
async function carregarCandidatos() {
  const resposta = await fetch(CONFIG.ARQUIVO_CANDIDATOS + '?t=' + Date.now());
  if (!resposta.ok) throw new Error('Não foi possível carregar candidatos: ' + resposta.status);
  candidatos = await resposta.json();
  renderizarCandidatos();
}

function renderizarCandidatos() {
  if (!listaCandidatos) return;

  listaCandidatos.innerHTML = '';

  if (!candidatos || candidatos.length === 0) {
    listaCandidatos.innerHTML = '<div style="padding:20px;text-align:center;color:#6c757d;">Nenhum candidato dispon&iacute;vel.</div>';
    return;
  }

  candidatos.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'candidato-card';
    card.dataset.numero = c.numero;
    card.style.cursor = 'pointer';

    const ehBranco = c.numero === '0';

    let fotoHtml = '';
    if (c.foto && !ehBranco) {
      fotoHtml = `<img src="${c.foto}" alt="${c.nome}" onerror="this.style.display='none';this.parentNode.innerHTML='<div style=\\\"width:110px;height:110px;border-radius:50%;background:#e2e8ea;margin:0 auto 14px\\\"></div>';">`;
    }

    const viceHtml = c.vice ? `<br><small style="color:#C9862D;font-weight:700;">Vice: ${c.vice}</small>` : '';

    card.innerHTML = `
      <span class="numero" style="display:block;font-size:0.95rem;font-weight:900;color:#0E4B3A;margin-bottom:10px;background:#F2F5F5;padding:6px 12px;border-radius:8px;border:2px solid #0E4B3A;">${c.numero}</span>
      ${fotoHtml}
      <h3 style="font-size:1.25rem;margin-bottom:6px;color:#2C3E50;">${c.nome}</h3>
      <p style="font-size:0.95rem;color:#555;margin:4px 0;">${c.bio || c.cargo || ''}</p>
      ${viceHtml}
    `;

    if (ehBranco) {
      card.classList.add('branco');
      card.style.borderStyle = 'dashed';
      card.style.background = '#F8F9FA';
    }

    card.addEventListener('click', () => {
      selecionarCandidato(c);
    });
    listaCandidatos.appendChild(card);
  });
}

function selecionarCandidato(candidato) {
  candidatoSelecionado = candidato;
  document.querySelectorAll('.candidato-card').forEach((el) => {
    const isSelected = el.dataset.numero === candidato.numero;
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

  if (btnVotar) {
    btnVotar.disabled = false;
    btnVotar.textContent = `Confirmar ${candidato.nome} (${candidato.numero})`;
    btnVotar.style.background = '#E8A33D';
  }
}

// --------------------------------------------------------------------------
// Fluxo de votação
// --------------------------------------------------------------------------
function irParaConfirmacao() {
  if (!candidatoSelecionado) return;

  if (resumoVoto) {
    resumoVoto.innerHTML = `
      <h3 style="margin-bottom:16px;color:#0E4B3A;font-size:1.25rem;text-align:center;">Resumo do seu voto</h3>
      <div class="resumo-item">
        <span style="color:#2C3E50;font-weight:700;">Cargo:</span>
        <span class="valor" style="color:#0E4B3A;font-weight:800;font-size:1.05rem;">${CONFIG.CARGO}</span>
      </div>
      <div class="resumo-item">
        <span style="color:#2C3E50;font-weight:700;">Candidato:</span>
        <span class="valor" style="color:#0E4B3A;font-weight:800;font-size:1.05rem;">${candidatoSelecionado.nome} (${candidatoSelecionado.numero})</span>
      </div>
      ${candidatoSelecionado.vice ? `
      <div class="resumo-item">
        <span style="color:#2C3E50;font-weight:700;">Vice:</span>
        <span class="valor" style="color:#0E4B3A;font-weight:800;font-size:1.05rem;">${candidatoSelecionado.vice}</span>
      </div>
      ` : ''}
    `;
  }

  mostrarTela(telaConfirmacao);
}

async function confirmarVoto() {
  if (!candidatoSelecionado) return;

  const voto = {
    candidato: candidatoSelecionado.numero,
    candidatoNome: candidatoSelecionado.nome,
    timestamp: new Date().toISOString(),
  };

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
      // Modo demonstração
      const votos = JSON.parse(localStorage.getItem('urna_votos_demo') || '[]');
      votos.push(voto);
      localStorage.setItem('urna_votos_demo', JSON.stringify(votos));
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
  [telaInicial, telaConfirmacao, telaFim].forEach((t) => {
    if (t) t.classList.remove('active');
  });
  if (tela) tela.classList.add('active');
}

function mostrarResultadoFinal(sucesso) {
  if (tituloFim) {
    tituloFim.textContent = sucesso ? 'Voto computado com sucesso!' : 'Erro';
  }
  if (msgFim) {
    msgFim.textContent = sucesso
      ? 'Obrigado por participar da votação da PASCOM S&atilde;o Jos&eacute.'
      : 'N&atilde;o foi poss&iacute;vel completar a votação.';
  }
  mostrarTela(telaFim);
}
