// ============================================================================
// CONFIGURAÇÃO DA URNA ELETRÔNICA - PASCOM SÃO JOSÉ
// ============================================================================
// Este arquivo é carregado por index.html e admin.html. Edite os valores abaixo.
// ATENÇÃO: num site público (GitHub Pages), os valores aqui são PÚBLICOS.
//   - A apiKey do Firebase NÃO é segredo; a proteção real são as regras
//     de segurança do Firestore (firestore.rules). Veja README.
//   - ADMIN_SENHA aqui é só uma barreira visual do painel, não é segurança forte.

window.CONFIG = {
  // -------------------------------------------------------------------------
  // FIREBASE (Firestore) - backend que grava os votos
  // Pegue estes valores em: Firebase Console > Configurações do projeto >
  // "Seus apps" > SDK do Firebase. Deixe apiKey vazio = MODO DEMONSTRAÇÃO
  // (votos só no localStorage do navegador, sem Firebase).
  // -------------------------------------------------------------------------
  FIREBASE: {
    apiKey: "AIzaSyC2-wBaql_iipGQEzlSmKxjtTXVMdTvQws",
    authDomain: "urna-pascomsjp.firebaseapp.com",
    projectId: "urna-pascomsjp",
    storageBucket: "urna-pascomsjp.firebasestorage.app",
    messagingSenderId: "809354219099",
    appId: "1:809354219099:web:c2a97b2ed07a87cfc3f97e",
    measurementId: "G-K1VY434XSB"
  },

  // Senha do painel de apuração (admin.html). Barreira visual.
  ADMIN_SENHA: 'pascom2026',

  // Eleição
  ELEICAO: 'Coordenação PASCOM São José 2026',
  CARGO: 'Coordenador(a) da PASCOM',

  // Arquivos
  ARQUIVO_CANDIDATOS: 'data/candidatos.json',
  ARQUIVO_VOTOS: 'votos.json', // usado só no modo demonstração (sem Firebase)
};
