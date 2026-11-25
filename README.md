# 🗳️ Urna Eletrônica - PASCOM São José

Sistema simples de votação online para a PASCOM da São José, com deploy gratuito via **GitHub Pages**.

## 📋 O que está incluído

| Página | Função |
|--------|--------|
| `index.html` | Urna de votação (eleitor vota) |
| `admin.html` | Painel de apuração (resultado + exportar CSV) |
| `css/style.css` | Estilo visual com cores da São José |
| `js/app.js` | Lógica da urna |
| `js/admin.js` | Lógica da apuração |
| `data/candidatos.json` | Lista de candidatos (edite aqui) |
| `votos.json` | Banco de votos (inicial vazio) |
| `backend/Code.gs` | Google Apps Script para receber votos (opcional) |
| `.github/workflows/pages.yml` | Deploy automático no GitHub Pages |
| `assets/` | Pasta para a logo da São José (veja abaixo) |

## 🎨 Identidade visual - PASCOM São José

O sistema já vem com as cores da São José configuradas no `css/style.css`:

| Elemento | Cor | Uso |
|----------|-----|-----|
| Verde escuro | `#0E4B3A` | Cabeçalhos, botões primários |
| Dourado | `#E8A33D` | Destaques, botões de ação |
| Verde PASCOM | `#27AE60` | Sucesso, confirmação |
| Azul PASCOM | `#2980B9` | Elementos secundários |

### 🖼️ Adicionar a logo

Salve a imagem da logo da PASCOM São José como:

```
urna_eletronica/assets/logo-sao-jose.png
```

Recomendação: imagem PNG quadrada, fundo transparente, mínimo 500×500 px.

## 🚀 Como colocar no ar

### 1. Publique no GitHub Pages

O workflow em `.github/workflows/pages.yml` já está configurado. Basta:

1. Enviar estes arquivos para o GitHub (branch `main`).
2. No repositório no GitHub, vá em **Settings > Pages**.
3. Em "Build and deployment", defina **Source** como **GitHub Actions**.
4. O deploy será executado automaticamente a cada `push`.

Sua urna ficará disponível em:
`https://SEU-USUARIO.github.io/urna_eletronica/`

### 2. Configure os candidatos

Edite `data/candidatos.json` com os nomes, números e fotos dos candidatos da PASCOM.

### 3. Mude a senha do admin

Copie `config.example.js` para `config.js` e altere `ADMIN_SENHA`:
```bash
cp config.example.js config.js
```

> ⚠️ **Não suba o `config.js` com senha real se o repositório for público.** Use variáveis de ambiente ou hospede o backend separadamente.

### 4. (Opcional) Configurar backend para receber votos de verdade

Por padrão, o sistema funciona em **modo demonstração** (votos ficam apenas no navegador de quem vota). Para gravar votos de forma centralizada:

1. Acesse https://script.google.com/
2. Crie um projeto, cole o conteúdo de `backend/Code.gs`.
3. Implante como **Aplicativo da web** (acesso: qualquer pessoa).
4. Cole a URL gerada em `config.js`, na variável `BACKEND_URL`.

Dessa forma, cada voto enviado pela urna será gravado na Planilha Google vinculada.

## 🗳️ Como usar

1. Eleitor acessa `index.html`, digita seu identificador e vota.
2. Após confirmar, o voto é computado (e enviado ao backend, se configurado).
3. Acesse `admin.html`, digite a senha de apuração e veja o resultado em tempo real.
4. Exporte o resultado em CSV pelo botão **Exportar CSV**.

## 🔒 Segurança (nível simples)

Este é um sistema **simples e leve**, indicado para votações de pequena escala (ex: pastoral, paróquia). Ele **não substitui** uma urna eletrônica oficial com certificado digital e auditoria.

Principais pontos:
- O identificador do eleitor evita voto duplicado apenas no modo demo (localStorage).
- Com o Google Apps Script configurado, o voto duplicado precisa ser controlado na planilha.
- A senha do admin protege o painel de apuração.

## 🛠️ Estrutura de pastas

```
urna_eletronica/
├── index.html                # Urna de votação
├── admin.html                # Painel de apuração
├── config.example.js         # Exemplo de configuração
├── votos.json                # Banco de votos (exemplo)
├── data/
│   └── candidatos.json       # Lista de candidatos
├── css/
│   └── style.css             # Estilos
├── js/
│   ├── app.js                # Lógica da urna
│   └── admin.js              # Lógica da apuração
├── backend/
│   └── Code.gs               # Google Apps Script (opcional)
└── .github/
    └── workflows/
        └── pages.yml         # Deploy GitHub Pages
```

## 📄 Licença

Livre para uso na PASCOM São José e outras comunidades.
