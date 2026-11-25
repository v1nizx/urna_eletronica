// ============================================================================
// PAINEL DE APURAÇÃO - PASCOM SÃO JOSÉ
// ============================================================================

let CONFIG = window.CONFIG || {
  ADMIN_SENHA: 'pascom2026',
  ARQUIVO_VOTOS: 'votos.json',
  ARQUIVO_CANDIDATOS: 'data/candidatos.json',
  ELEICAO: 'Coordenação PASCOM São José 2026',
  CARGO: 'Coordenador(a) da PASCOM',
};

let candidatos = [];

const telaLogin = document.getElementById('tela-login');
const telaApuracao = document.getElementById('tela-apuracao');

const inputSenha = document.getElementById('senha-admin');
const btnEntrar = document.getElementById('btn-entrar-admin');
const msgErro = document.getElementById('msg-erro-admin');

const btnAtualizar = document.getElementById('btn-atualizar');
const btnExportar = document.getElementById('btn-exportar');
const btnSair = document.getElementById('btn-sair-admin');

const totalVotosEl = document.getElementById('total-votos');
const tabelaBody = document.querySelector('#tabela-resultado tbody');
const votosExtra = document.getElementById('votos-brancos-nulos');

// --------------------------------------------------------------------------
// Inicialização
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await carregarCandidatos();

  btnEntrar.addEventListener('click', fazerLogin);
  btnAtualizar.addEventListener('click', carregarApuracao);
  btnExportar.addEventListener('click', exportarCSV);
  btnSair.addEventListener('click', sair);

  inputSenha.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fazerLogin();
  });
});

// --------------------------------------------------------------------------
// Login
// --------------------------------------------------------------------------
function fazerLogin() {
  const senha = inputSenha.value.trim();
  if (senha === CONFIG.ADMIN_SENHA) {
    telaLogin.classList.remove('active');
    telaApuracao.classList.add('active');
    carregarApuracao();
  } else {
    msgErro.textContent = 'Senha incorreta.';
    inputSenha.value = '';
  }
}

function sair() {
  telaApuracao.classList.remove('active');
  telaLogin.classList.add('active');
  inputSenha.value = '';
  msgErro.textContent = '';
}

// --------------------------------------------------------------------------
// Dados
// --------------------------------------------------------------------------
async function carregarCandidatos() {
  try {
    const resposta = await fetch(CONFIG.ARQUIVO_CANDIDATOS);
    candidatos = await resposta.json();
  } catch (e) {
    console.error('Erro ao carregar candidatos:', e);
    candidatos = [];
  }
}

async function carregarApuracao() {
  try {
    const resposta = await fetch(CONFIG.ARQUIVO_VOTOS + '?t=' + Date.now());
    if (!resposta.ok) throw new Error('Não foi possível carregar os votos');
    const votos = await resposta.json();
    renderizarApuracao(votos);
  } catch (e) {
    console.error(e);
    tabelaBody.innerHTML = '<tr><td colspan="4" style="color:red">Erro ao carregar votos.</td></tr>';
  }
}

function renderizarApuracao(votos) {
  // Conta votos por candidato
  const contagem = {};
  candidatos.forEach((c) => {
    contagem[c.numero] = { nome: c.nome, votos: 0 };
  });

  let brancosNulos = 0;
  votos.forEach((v) => {
    if (contagem[v.candidato]) {
      contagem[v.candidato].votos++;
    } else {
      brancosNulos++;
    }
  });

  const total = votos.length;
  totalVotosEl.textContent = `Total de votos: ${total}`;

  // Ordena por votos descrescente
  const ranking = Object.entries(contagem)
    .map(([numero, info]) => ({ numero, ...info }))
    .sort((a, b) => b.votos - a.votos);

  tabelaBody.innerHTML = '';
  ranking.forEach((item) => {
    const pct = total > 0 ? ((item.votos / total) * 100).toFixed(1) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.numero}</td>
      <td>${item.votos}</td>
      <td>${pct}%</td>
    `;
    tabelaBody.appendChild(tr);
  });

  votosExtra.innerHTML = `
    <div class="votos-extra">
      <strong>Votos brancos/nulos:</strong> ${brancosNulos}
    </div>
  `;
}

// --------------------------------------------------------------------------
// Exportar CSV
// --------------------------------------------------------------------------
function exportarCSV() {
  fetch(CONFIG.ARQUIVO_VOTOS + '?t=' + Date.now())
    .then((r) => r.json())
    .then((votos) => {
      let csv = 'eleitor,candidato,candidatoNome,timestamp\n';
      votos.forEach((v) => {
        csv += `"${v.eleitor}","${v.candidato}","${(v.candidatoNome || '').replace(/"/g, '""')}","${v.timestamp}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `apuracao_pascom_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((e) => {
      console.error(e);
      alert('Erro ao exportar CSV.');
    });
}
