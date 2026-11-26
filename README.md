# 🗳️ Urna Eletrônica - PASCOM São José

Sistema simples de votação online para a PASCOM da São José, com deploy gratuito via **GitHub Pages** e backend gratuito via **Firebase (Firestore)**.

## 📋 O que está incluído

| Página | Função |
|--------|--------|
| `index.html` | Urna de votação (eleitor se identifica + vota) |
| `admin.html` | Painel de apuração (resultado + exportar CSV) |
| `css/style.css` | Estilo visual com cores da São José |
| `js/app.js` | Lógica da urna |
| `js/firebase.js` | Conexão com Firebase/Firestore + **voto único** (módulo) |
| `js/admin.js` | Lógica da apuração |
| `config.js` | Configuração (carregado por `index.html` e `admin.html`) |
| `data/candidatos.json` | Lista de candidatos (edite aqui) |
| `votos.json` | Votos de exemplo (só usado no **modo demonstração**, sem Firebase) |
| `firestore.rules` | Regras de segurança do Firestore |
| `firebase.json` | Para publicar as regras com a CLI do Firebase |
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

#### 🖼️ Adicionar a logo

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

Edite `data/candidatos.json` com os candidatos da PASCOM. A estrutura já está pronta:

| Campo | Descrição |
|-------|-----------|
| `numero` | Número da urna (ex: 17, 34) |
| `nome` | Nome da chapa (ex: "Juliana e Ana Letícia") |
| `coordenador` | Nome do coordenador(a) |
| `vice` | Nome do vice |
| `foto` | Caminho da foto (ex: `assets/foto-juliana.png`) |
| `bio` | Descrição da chapa |

#### 📸 Adicionar fotos

Salve as fotos na pasta `assets/` e referencie no `candidatos.json`:

```
urna_eletronica/
├── assets/
│   ├── logo-sao-jose.png
│   ├── foto-juliana.png
│   ├── foto-pamela.png
│   └── ...
└── data/
    └── candidatos.json
```

No JSON:
```json
"foto": "assets/foto-juliana.png"
```

Recomendação: imagens quadradas (400×400 px), formato PNG ou JPG.

#### 🔢 Números dos candidatos

- **Branco**: número **0**

> Regra da eleição: o terceiro mais votado entra como secretário.

### 3. Mude a senha do admin

Edite `ADMIN_SENHA` em `config.js`.

> ⚠️ **Não suba `config.js` com senha real se o repositório for público.**
> A senha do painel é uma barreira visual, **não** é segurança forte.

### 4. Configure o Firebase (Firestore) para gravar os votos de verdade

Por padrão (`FIREBASE.apiKey` vazio) o sistema funciona em **modo demonstração**: votos ficam só no `localStorage` de quem vota e o voto único é por navegador. Para gravar centralizado no **Firebase (gratuito)**:

1. Acesse https://console.firebase.google.com/ e crie um projeto (plano **Spark**, gratuito, sem cartão).
2. No projeto, crie um **App da Web** (ícone `</>`). O Firebase mostra um objeto `firebaseConfig`.
3. Copie esses valores para `config.js`, dentro de `FIREBASE`:
   ```js
   FIREBASE: {
     apiKey: '...',
     authDomain: 'SEU-PROJETO.firebaseapp.com',
     projectId: 'SEU-PROJETO',
     storageBucket: 'SEU-PROJETO.appspot.com',
     messagingSenderId: '...',
     appId: '...',
   },
   ```
   > A `apiKey` do Firebase **não é segredo**. A proteção real são as regras do Firestore (passo 4).
4. Crie o banco **Firestore Database** (modo de produção) e **aplique as regras** de `firestore.rules`:
   - Console → Firestore Database → **Regras** → colar o conteúdo de `firestore.rules` → **Publicar**; **ou**
   - com a CLI do Firebase: `firebase deploy --only firestore:rules`.
5. **Cadastre os eleitores aptos** (ver próxima seção). `votou` e `votos` são criados automaticamente. A coleção de apuração é `votos`.

Veja `js/firebase.js` para o detalhe técnico.

### 5. Cadastrar os eleitores (telefone + conferência)

O "número" do eleitor é o **telefone**. Você **cadastra cada pessoa no banco**; na hora de votar o app **confere** se o telefone está cadastrado.

**Coleção `eleitores`, um documento por pessoa:**
- ⚠️ **IMPORTANTE: o ID do documento DEVE ser o próprio telefone normalizado** (só dígitos, DDD + número, sem código de país; ex.: `98912345678`). No Console, ao clicar em **Adicionar documento**, **digite esse ID** — **não** deixe em branco (se deixar, o Firebase gera um ID random e o app NÃO encontra o cadastro). O telefone como **campo** não basta; o ID é a chave da consulta.
- campos sugeridos: `nome` (string) e `telefone` (string, mesmo valor normalizado). Ex.: `{ "nome": "Maria Silva", "telefone": "98912345678" }`.

**Normalização aplicada ao que o eleitor digita** (`js/firebase.js` `normalizarTelefone`):
só dígitos → remove prefixo de acesso `0` → remove código de país `55`. `(11) 99999-9999`, `11999999999`, `+55 11 99999-9999`, `5511999999999` → **`11999999999`**. Cadastre com o mesmo formato final.

**Como cadastrar:**
- **Console:** Firestore Database → coleção `eleitores` → *Iniciar coleção* / *Adicionar documento*; ID = telefone; campos `nome` + `telefone`.
- **Em lote (CLI):** exporte um JSON/`firebase-admin` script e faça `set` nos ids. (A regra `eleitores: allow write: if false` impede o app de cadastrar; só você, admin, cadastra.)

> Se o app disser **"Permissão negada no Firestore: publique as regras"**, vá em **Firestore Database > Regras**, cole `firestore.rules` e **Publicar** (o modo produção vem com `allow read, write: if false` por padrão). Aguarde ~1 min.
>
> Se disser **"Este telefone não está cadastrado"**, confira se o **ID do documento** em `eleitores` é exatamente o telefone normalizado (não um ID automático/random) e se as regras já estão publicadas.
>
> Se disser **"Este telefone já votou"**, existe um documento em `votou/{telefone}` de um teste anterior; apague-o no Console para repetir o teste.

## 🗳️ Como usar

1. O eleitor acessa `index.html`, **digita o seu telefone cadastrado** e clica em **Continuar**.
   - O app consulta o Firestore (não grava nada): o telefone precisa estar em `eleitores` (**cadastrado/apto**) e **não** em `votou` (**ainda não votou**); senão, bloqueia.
2. O eleitor escolhe Coordenação e Vice, confere em **Confirme seus votos** e clica **Confirmar voto**.
   - O voto só é dado por computado quando o Firestore **confirma a gravação**. Se algo falhar, mostra erro (não "sucesso" falso).
   - Na hora de gravar, o Firestore **re-verifica tudo numa transação atômica**: `eleitores/{telefone}` existe, `votou/{telefone}` não existe; grava `votou` + `voto` juntos.
3. Acesse `admin.html`, digite a senha de apuração e veja o resultado. Clique **Atualizar**.
4. Exporte o resultado em CSV pelo botão **Exportar CSV**. (Com Firebase, os votos vêm da coleção `votos`, que é anônima.)

## 🔍 Se os votos NÃO apareceram no Firebase (checklist)

1. **`config.js` está sendo carregado?** `index.html`/`admin.html` carregam `<script src="config.js">`. Não defina `window.CONFIG` inline por cima dele.
2. **`FIREBASE.apiKey` e `FIREBASE.projectId` preenchidos?** Sem isso é **modo demonstração** (localStorage). No console do navegador aparece `Firebase Firestore conectado` quando ok, ou `Firebase não configurado`.
3. **Firestore criado?** Console → Firestore Database → criar banco.
4. **Regras aplicadas?** Sem `allow create`, a gravação falha com `permission-denied`. Aplique `firestore.rules`. O app **não mostra sucesso** se a gravação falhar.
5. **apiKey/projectId corretos?** Confira no Console → Configurações do projeto → "Seus apps".
6. **Console do navegador (F12)** mostra erros. A urna só mostra "Voto computado!" se o Firestore confirmou.
7. **Cadastro**: se aparecer "Este telefone não está cadastrado", o id não bate em `eleitores`. Confira normalização. Se "já votou", já existe `votou/{telefone}`.

## 🔒 Segurança (nível simples)

Este é um sistema **simples e leve**, indicado para votações de pequena escala (ex: pastoral, paróquia). **Não substitui** uma urna eletrônica oficial com certificado digital e auditoria.

Pontos fortes:
- **O telefone é o número.** Normalizado (só dígitos, sem código de país/formatos) para casar com o cadastro.
- **Conferência de cadastro**: só vota quem tem `eleitores/{telefone}`; verificado no cliente e **de novo no servidor** (transação).
- **Voto único**: marcador `votou/{telefone}` + voto na **mesma transação atômica**; `votou` só permite `create`, **não** `update`/`delete`. Não duplica, mesmo com cliques repetidos/concorrência. `eleitores` não é gravável pelo app.
- **Sigilo do voto**: `votos` **não guarda telefone nem nome**; não dá para ligar voto↔eleitor. O telefone fica só no marcador `votou`.
- `eleitores`/`votou`: `allow get` mas **não `list`**; `votos` só pode ser criado, **não** alterado/apagado.
- No modo demonstração, voto único é controlado por `localStorage` (fácil de burlar; só para teste) e **não** há conferência de cadastro.

**Limitações honestas (não esconder):**
- **Sem Firebase Authentication**, "cadastrado + não duplicado" garante **não-duplicidade**, **não** prova de identidade: quem souber um telefone cadastrado pode tentar usá-lo; quem chegar primeiro vota. Não há verificação de posse do telefone (SMS/OTP).
- A `apiKey` do Firebase é pública; proteção = regras do Firestore. Regras atuais liberam `allow read` em `votos` (anônimo) e `get` em `eleitores`/`votou`. Restrinja se for sensível.
- A senha do admin é apenas visual.
- **Para eleição oficial / segura**: **Firebase Authentication** + votar via **Cloud Function** (servidor, sem escrita direta do cliente) + regras restritas + auditoria/logs.

## 🛠️ Estrutura de pastas

```
urna_eletronica/
├── index.html                # Urna de votação
├── admin.html                # Painel de apuração
├── config.js                 # Configuração (Firebase, senha, eleição)
├── config.example.js         # Modelo de configuração
├── firestore.rules           # Regras de segurança do Firestore
├── firebase.json             # CLI do Firebase (publicar regras)
├── votos.json                # Votos de exemplo (só modo demonstração)
├── data/
│   └── candidatos.json       # Lista de candidatos
├── css/
│   └── style.css             # Estilos
├── js/
│   ├── app.js                # Lógica da urna
│   ├── firebase.js           # Firebase/Firestore + voto único (módulo)
│   └── admin.js              # Lógica da apuração
├── backend/                  # (removido: não usa mais Google Apps Script)
└── .github/
    └── workflows/
        └── pages.yml         # Deploy GitHub Pages
```

## 📄 Licença

Livre para uso na PASCOM São José e outras comunidades.
