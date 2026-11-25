// ============================================================================
// CONFIGURAÇÃO DA URNA ELETRÔNICA - PASCOM SÃO JOSÉ
// ============================================================================
// Copie este arquivo para config.js e preencha os valores abaixo.

const CONFIG = {
  // --------------------------------------------------------------------------
  // BACKEND (Google Apps Script)
  // --------------------------------------------------------------------------
  // URL do Web App do Google Apps Script que recebe os votos.
  // Deixe em branco ('') para usar o modo demonstração (localStorage).
  // Veja o arquivo backend/Code.gs para instruções de deploy.
  BACKEND_URL: 'https://script.google.com/macros/s/AKfycbxRpQymP6jPBhUQ8vTShjvN6nJUxrFNs4dppIePxrc5WRl2l0efDioVAP2muI0P7SojIw/exec',

  // --------------------------------------------------------------------------
  // PAINEL DE APURAÇÃO (admin)
  // --------------------------------------------------------------------------
  // Senha para acessar o painel de apuração. ALMUDE ISTO antes de publicar!
  ADMIN_SENHA: 'pascom2026',

  // --------------------------------------------------------------------------
  // ELEIÇÃO
  // --------------------------------------------------------------------------
  ELEICAO: 'Coordenação PASCOM São José 2027-2028',
  CARGO: 'Coordenador(a) da PASCOM','Vice-Coordenador(a) da PASCOM','Secretário(a) da PASCOM', 

  // --------------------------------------------------------------------------
  // ARQUIVOS
  // --------------------------------------------------------------------------
  ARQUIVO_CANDIDATOS: 'data/candidatos.json',
  ARQUIVO_VOTOS: 'votos.json',
};
