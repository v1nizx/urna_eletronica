// ============================================================================
// CONFIGURAÇÃO DA URNA ELETRÔNICA - PASCOM SÃO JOSÉ (modelo)
// ============================================================================
// Copie este arquivo para config.js e preencha os valores:
//   cp config.example.js config.js
// (No repositório já existe um config.js; ajuste os valores nele.)

window.CONFIG = {
  FIREBASE: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
  ADMIN_SENHA: 'TROQUE_ESTA_SENHA',
  ELEICAO: 'Coordenação PASCOM São José 2026',
  CARGO: 'Coordenador(a) da PASCOM',
  ARQUIVO_CANDIDATOS: 'data/candidatos.json',
  ARQUIVO_VOTOS: 'votos.json',
};
