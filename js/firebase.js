// ============================================================================
// FIREBASE (Firestore) - Backend da Urna Eletrônica PASCOM São José
// ============================================================================
// Carregado como <script type="module"> ANTES de js/app.js e js/admin.js.
// Lê a configuração em window.CONFIG.FIREBASE (ver config.js).
//
// O "número" do eleitor é o TELEFONE cadastrado. Firestore:
//
//   eleitores/{telefone}  CADASTRO DE APTOS. id = telefone normalizado.
//                         Você cadastra os eleitores (nome + telefone).
//                         App só faz get(1 doc); listagem bloqueada nas regras.
//   votou/{telefone}      MARCADOR DE VOTO ÚNICO. Criado 1x pelo app na mesma
//                         transação do voto. Só `create`; sem update/delete.
//   votos/{autoId}        O VOTO. NÃO guarda telefone/nome do eleitor
//                         (sigilo: não dá para ligar voto↔eleitor).
//
// VERIFICAÇÃO no momento de votar (transação atômica):
//   1) eleitores/{telefone} PRECISA existir  -> senão erro 'nao_cadastrado'
//   2) votou/{telefone} NÃO pode existir     -> senão erro 'ja_votou'
//   3) grava votou/{telefone} + votos/{id}   -> tudo ou nada
//
// TELEFONE: normalização -> só dígitos, remove prefixo de acesso 0,
// remove código de país 55 (BR). Registre `eleitores` com o MESMO formato
// (DDD + número, só dígitos). Ex.: (11) 99999-9999 -> 11999999999.
//
// Se CONFIG.FIREBASE não estiver preenchido, `disponivel` = false e o app
// cai no MODO DEMONSTRAÇÃO (localStorage). No demo NÃO há cadastro de aptos.
// ============================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';

const VERSAO = '13.4.0';

const COLECAO_ELEITORES = 'eleitores'; // cadastro de aptos
const COLECAO_VOTOU = 'votou';         // marcador de voto único
const COLECAO_VOTOS = 'votos';         // votos (sem PII)

let db = null;
let disponivel = false;

// ----------------------------------------------------------------------------
// Normalização do TELEFONE
// ----------------------------------------------------------------------------
function normalizarTelefone(valor) {
  if (valor === null || valor === undefined) return '';
  let d = String(valor).trim().replace(/\D/g, ''); // só dígitos
  if (!d) return '';
  d = d.replace(/^0+/, '');                        // remove prefixo de acesso 0
  if (d.length >= 12 && d.indexOf('55') === 0) {   // remove código do país 55 (BR)
    d = d.slice(2);
  }
  d = d.replace(/^0+/, '');
  return d;
}

// id de documento Firestore = telefone normalizado (só dígitos; nunca reservado)
function idTelefone(numero) {
  return normalizarTelefone(numero);
}

function timestampParaISO(valor) {
  if (!valor) return '';
  if (typeof valor === 'string') return valor;
  if (valor.toDate && typeof valor.toDate === 'function') {
    try { return valor.toDate().toISOString(); } catch (e) { return ''; }
  }
  if (valor.seconds != null) {
    try { return new Date(valor.seconds * 1000).toISOString(); } catch (e) { return ''; }
  }
  return '';
}

function erro(codigo, mensagem) {
  const e = new Error(mensagem || codigo);
  e.codigo = codigo;
  return e;
}

// ----------------------------------------------------------------------------
// Inicialização
// ----------------------------------------------------------------------------
(function iniciar() {
  try {
    const config = window.CONFIG || {};
    const fb = config.FIREBASE;

    if (!fb || !fb.apiKey || !fb.projectId) {
      console.warn(
        'Firebase não configurado (CONFIG.FIREBASE.apiKey/projectId). ' +
        'Modo demonstração (localStorage).'
      );
      return;
    }

    const app = initializeApp(fb);
    db = getFirestore(app);
    disponivel = true;
    console.log('Firebase Firestore conectado (projeto:', fb.projectId + ')', 'SDK', VERSAO);
  } catch (e) {
    console.error('Falha ao iniciar o Firebase:', e);
    disponivel = false;
    db = null;
  }
})();

// ----------------------------------------------------------------------------
// API exposta para app.js / admin.js
// ----------------------------------------------------------------------------
window.UrnaFirebase = {
  versao: VERSAO,

  get disponivel() { return disponivel; },
  get db() { return db; },

  normalizarTelefone,

  // Verificação SEM gravar nada. Retorna { cadastrado, jaVotou, telefone, nome }
  async checarEleitor(telefone) {
    const numero = normalizarTelefone(telefone);
    const vazio = { cadastrado: false, jaVotou: false, telefone: numero, nome: '' };
    if (!numero || !disponivel || !db) return vazio;

    const id = idTelefone(numero);
    const [cadSnap, votouSnap] = await Promise.all([
      getDoc(doc(db, COLECAO_ELEITORES, id)),
      getDoc(doc(db, COLECAO_VOTOU, id)),
    ]);

    const dados = cadSnap.exists() ? (cadSnap.data() || {}) : {};
    return {
      cadastrado: cadSnap.exists(),
      jaVotou: votouSnap.exists(),
      telefone: numero,
      nome: dados.nome || '',
    };
  },

  // Voto único ATÔMICO. Lança erro com .codigo:
  //   'telefone_obrigatorio' | 'nao_cadastrado' | 'ja_votou' | 'voto_incompleto'
  async votar(voto) {
    if (!disponivel || !db) throw erro('firebase_indisponivel', 'Firebase indisponível.');

    const telefone = normalizarTelefone(voto.telefone);
    const coordenacao = String(voto.coordenacao == null ? '' : voto.coordenacao).trim();
    const vice = String(voto.vice == null ? '' : voto.vice).trim();

    if (!telefone) throw erro('telefone_obrigatorio', 'Informe o telefone do eleitor.');
    if (!coordenacao || !vice) throw erro('voto_incompleto', 'Campos coordenacao e vice são obrigatórios.');

    const id = idTelefone(telefone);
    const eleitorRef = doc(db, COLECAO_ELEITORES, id); // cadastro (já deve existir)
    const votouRef = doc(db, COLECAO_VOTOU, id);       // marcador de único
    const votoRef = doc(collection(db, COLECAO_VOTOS)); // id automático

    // VOTO sem telefone/nome do eleitor (sigilo)
    const registro = {
      coordenacao,
      coordenacaoNome: String(voto.coordenacaoNome || '').trim(),
      vice,
      viceNome: String(voto.viceNome || '').trim(),
      timestamp: voto.timestamp || new Date().toISOString(),
      recebidoEm: serverTimestamp(),
    };

    await runTransaction(db, async (tx) => {
      // ---- leituras (antes das escritas)
      const cadSnap = await tx.get(eleitorRef);
      const votouSnap = await tx.get(votouRef);

      // 1) só permite votar se estiver cadastrado
      if (!cadSnap.exists()) throw erro('nao_cadastrado', 'Telefone não está cadastrado.');
      // 2) só permite votar se for novo
      if (votouSnap.exists()) throw erro('ja_votou', 'Este telefone já votou.');

      // ---- escritas atômicas
      tx.set(votouRef, { telefone, em: serverTimestamp() }); // PII só no marcador
      tx.set(votoRef, registro);                             // voto sem PII
    });

    return { ok: true, mensagem: 'Voto recebido', registro };
  },

  // Lista votos para apuração (SEM telefone/nome do eleitor).
  async listarVotos() {
    if (!disponivel || !db) return [];
    const snap = await getDocs(collection(db, COLECAO_VOTOS));
    const votos = [];
    snap.forEach((d) => {
      const v = d.data() || {};
      votos.push({
        id: d.id,
        coordenacao: v.coordenacao,
        coordenacaoNome: v.coordenacaoNome || '',
        vice: v.vice,
        viceNome: v.viceNome || '',
        timestamp: timestampParaISO(v.timestamp),
        recebidoEm: timestampParaISO(v.recebidoEm),
      });
    });
    return votos;
  },

  // (auxiliar) lista eleitores cadastrados — requer permissão de lista.
  async listarEleitores() {
    if (!disponivel || !db) return [];
    const snap = await getDocs(collection(db, COLECAO_ELEITORES));
    const lista = [];
    snap.forEach((d) => { const v = d.data() || {}; lista.push({ id: d.id, ...v }); });
    return lista;
  },
};
