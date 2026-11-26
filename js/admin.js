// ============================================================================
// PAINEL DE APURAÇÃO - PASCOM SÃO JOSÉ
// Votação em 2 etapas:
//   - Coordenador(a): mais votado na etapa de Coordenação
//   - Vice-coordenador(a): mais votado na etapa de Vice
//   - Secretário(a): mais votado no total geral que não foi coordenador nem vice
// ============================================================================

let CONFIG = window.CONFIG || {
  ADMIN_SENHA: 'pascom2026',
  ARQUIVO_VOTOS: 'votos.json',
  ARQUIVO_CANDIDATOS: 'data/candidatos.json',
  ELEICAO: 'Coordenação PASCOM São José 2026',
  CARGO: 'Coordenação da PASCOM',
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
    const resposta = await fetch(CONFIG.ARQUIVO_CANDIDATOS + '?t=' + Date.now());
    candidatos = await resposta.json();
  } catch (e) {
    console.error('Erro ao carregar candidatos:', e);
    candidatos = [];
  }
}

// Busca os votos: Firestore (Firebase) quando configurado; senão votos.json.
async function obterVotos() {
  if (window.UrnaFirebase && window.UrnaFirebase.disponivel) {
    return await window.UrnaFirebase.listarVotos();
  }
  const resposta = await fetch(CONFIG.ARQUIVO_VOTOS + '?t=' + Date.now());
  if (!resposta.ok) throw new Error('Não foi possível carregar os votos');
  return await resposta.json();
}

async function carregarApuracao() {
  try {
    const votos = await obterVotos();
    renderizarApuracao(votos);
  } catch (e) {
    console.error(e);
    tabelaBody.innerHTML = '<tr><td colspan="7" style="color:red">Erro ao carregar votos. Configure o Firebase ou adicione votos no votos.json.</td></tr>';
  }
}

function renderizarApuracao(votos) {
  // Estrutura de contagem por candidato
  const contagem = {};
  candidatos.forEach((c) => {
    contagem[c.numero] = {
      nome: c.nome,
      votosCoordenacao: 0,
      votosVice: 0,
      total: 0,
      ehBranco: c.numero === '0',
    };
  });

  let brancosCoordenacao = 0;
  let brancosVice = 0;

  votos.forEach((v) => {
    // Suporta formato novo (coordenacao/vice) e antigo (candidato)
    if (v.coordenacao !== undefined || v.vice !== undefined) {
      if (v.coordenacao === '0') {
        brancosCoordenacao++;
      } else if (contagem[v.coordenacao]) {
        contagem[v.coordenacao].votosCoordenacao++;
        contagem[v.coordenacao].total++;
      }

      if (v.vice === '0') {
        brancosVice++;
      } else if (contagem[v.vice]) {
        contagem[v.vice].votosVice++;
        contagem[v.vice].total++;
      }
    } else if (v.candidato !== undefined) {
      // Formato antigo: conta como coordenação
      if (v.candidato === '0') {
        brancosCoordenacao++;
      } else if (contagem[v.candidato]) {
        contagem[v.candidato].votosCoordenacao++;
        contagem[v.candidato].total++;
      }
    }
  });

  const totalEleitores = votos.length;
  totalVotosEl.textContent = `Total de eleitores que votaram: ${totalEleitores}`;

  // Candidatos válidos (exclui branco), ordenados por total
  const ranking = Object.entries(contagem)
    .map(([numero, info]) => ({ numero, ...info }))
    .filter((item) => !item.ehBranco)
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return parseInt(a.numero) - parseInt(b.numero);
    });

  // Define cargos
  const eleitos = { coordenador: null, vice: null, secretario: null };

  // Coordenador: mais votado em coordenação (desempate por número)
  const rankingCoord = [...ranking].sort((a, b) => {
    if (b.votosCoordenacao !== a.votosCoordenacao) return b.votosCoordenacao - a.votosCoordenacao;
    return parseInt(a.numero) - parseInt(b.numero);
  });
  if (rankingCoord.length > 0 && rankingCoord[0].votosCoordenacao > 0) {
    eleitos.coordenador = rankingCoord[0].numero;
  }

  // Vice: mais votado em vice, excluindo o coordenador
  const rankingVice = [...ranking]
    .filter((c) => c.numero !== eleitos.coordenador)
    .sort((a, b) => {
      if (b.votosVice !== a.votosVice) return b.votosVice - a.votosVice;
      return parseInt(a.numero) - parseInt(b.numero);
    });
  if (rankingVice.length > 0 && rankingVice[0].votosVice > 0) {
    eleitos.vice = rankingVice[0].numero;
  }

  // Secretário: mais votado no total, excluindo coordenador e vice
  const rankingSecretario = ranking.filter(
    (c) => c.numero !== eleitos.coordenador && c.numero !== eleitos.vice
  );
  if (rankingSecretario.length > 0 && rankingSecretario[0].total > 0) {
    eleitos.secretario = rankingSecretario[0].numero;
  }

  // Função para obter cargo do candidato
  function cargoDe(numero) {
    if (numero === eleitos.coordenador) return 'Coordenador(a)';
    if (numero === eleitos.vice) return 'Vice-coordenador(a)';
    if (numero === eleitos.secretario) return 'Secretário(a)';
    return '—';
  }

  // Renderiza tabela
  tabelaBody.innerHTML = '';
  if (ranking.length === 0) {
    tabelaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6c757d;">Nenhum voto computado ainda.</td></tr>';
  } else {
    ranking.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700;color:#0E4B3A;">${index + 1}º</td>
        <td><strong>${item.nome}</strong></td>
        <td>${item.numero}</td>
        <td style="text-align:center;">${item.votosCoordenacao}</td>
        <td style="text-align:center;">${item.votosVice}</td>
        <td style="font-weight:700;text-align:center;">${item.total}</td>
        <td style="font-weight:700;color:#C9862D;">${cargoDe(item.numero)}</td>
      `;
      tabelaBody.appendChild(tr);
    });
  }

  // Resumo dos eleitos
  let resumo = '';
  resumo += '<div class="votos-extra">';
  resumo += `<strong>Votos em branco — Coordenação:</strong> ${brancosCoordenacao}<br>`;
  resumo += `<strong>Votos em branco — Vice:</strong> ${brancosVice}`;
  resumo += '</div>';

  if (eleitos.coordenador || eleitos.vice || eleitos.secretario) {
    resumo += '<div class="cargos-eleitos" style="margin-top:24px;padding:16px;background:#FBF1E0;border-radius:12px;border:2px solid #E8A33D;">';
    resumo += '<h3 style="color:#0E4B3A;margin-bottom:14px;text-align:center;">Composição da Coordenação</h3>';

    const nomeDe = (numero) => {
      const c = candidatos.find((x) => x.numero === numero);
      return c ? c.nome : '—';
    };

    resumo += criarLinhaCargo('Coordenador(a)', nomeDe(eleitos.coordenador));
    resumo += criarLinhaCargo('Vice-coordenador(a)', nomeDe(eleitos.vice));
    resumo += criarLinhaCargo('Secretário(a)', nomeDe(eleitos.secretario));

    resumo += '</div>';
  }

  votosExtra.innerHTML = resumo;
}

function criarLinhaCargo(cargo, nome) {
  return `
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #E8D5B0;gap:12px;">
      <span style="font-weight:700;color:#2C3E50;">${cargo}</span>
      <span style="font-weight:800;color:#0E4B3A;text-align:right;">${nome}</span>
    </div>
  `;
}

// --------------------------------------------------------------------------
// Exportar CSV
// --------------------------------------------------------------------------
async function exportarCSV() {
  try {
    const votos = await obterVotos();
    // votos são anônimos (sem telefone); total de eleitores = total de votos
    let csv = 'coordenacao,coordenacaoNome,vice,viceNome,timestamp\n';
    votos.forEach((v) => {
      const coord = v.coordenacao !== undefined ? v.coordenacao : (v.candidato || '');
      const coordNome = v.coordenacaoNome !== undefined ? v.coordenacaoNome : (v.candidatoNome || '');
      csv += `"${coord}","${(coordNome || '').replace(/"/g, '""')}","${v.vice || ''}","${(v.viceNome || '').replace(/"/g, '""')}","${v.timestamp || ''}"\n`;
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
  } catch (e) {
    console.error(e);
    alert('Erro ao exportar CSV.');
  }
}
