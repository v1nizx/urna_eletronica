// ============================================================================
// GOOGLE APPS SCRIPT - Backend da Urna Eletrônica PASCOM São José
// ============================================================================
// COMO USAR:
// 1. Acesse https://script.google.com/
// 2. Crie um novo projeto de script
// 3. Cole este código no editor
// 4. Clique em "Implantar" > "Nova implantação"
// 5. Tipo: Aplicativo da web
// 6. Executar como: Você mesmo
// 7. Quem tem acesso: Qualquer pessoa (mesmo não logada no Google)
// 8. Implante e copie a URL do Web App
// 9. Cole essa URL no arquivo config.example.js (renomeie para config.js)
//    na variável BACKEND_URL
// ============================================================================

const PLANILHA_ID = ''; // Opcional: ID da Planilha Google para gravar os votos
const SENHA_ADMIN = 'pascom2026'; // Deve bater com o ADMIN_SENHA do config.js

function doPost(e) {
  try {
    let dados;
    if (e.postData && e.postData.contents) {
      dados = JSON.parse(e.postData.contents);
    } else {
      dados = e.parameter;
    }

    // Valida campos obrigatórios
    if (!dados.eleitor || !dados.candidato) {
      return ContentService.createTextOutput(
        JSON.stringify({ erro: 'Campos obrigatórios ausentes' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const registro = {
      eleitor: dados.eleitor,
      candidato: dados.candidato,
      candidatoNome: dados.candidatoNome || '',
      timestamp: dados.timestamp || new Date().toISOString(),
      recebidoEm: new Date().toISOString(),
    };

    // Grava na planilha (se configurada)
    if (PLANILHA_ID) {
      const planilha = SpreadsheetApp.openById(PLANILHA_ID);
      const aba = planilha.getSheetByName('Votos') || planilha.insertSheet('Votos');
      if (aba.getLastRow() === 0) {
        aba.appendRow(['eleitor', 'candidato', 'candidatoNome', 'timestamp', 'recebidoEm']);
      }
      aba.appendRow([
        registro.eleitor,
        registro.candidato,
        registro.candidatoNome,
        registro.timestamp,
        registro.recebidoEm,
      ]);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, mensagem: 'Voto recebido' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (erro) {
    return ContentService.createTextOutput(
      JSON.stringify({ erro: erro.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'online', servico: 'Urna Eletrônica PASCOM São José' })
  ).setMimeType(ContentService.MimeType.JSON);
}
