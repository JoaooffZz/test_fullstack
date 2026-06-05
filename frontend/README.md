# GestaPro UI — Portal de Gestão de Contratos e Obras

Este diretório contém o frontend da plataforma multi-tenant de gestão de contratos, obras e suprimentos, desenvolvida de forma responsiva, moderna e orientada a performance.

---

## 🚀 Tecnologias Utilizadas

A aplicação utiliza as ferramentas mais recentes do ecossistema de desenvolvimento Web:

*   **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Ferramenta de Build**: [Vite 8](https://vite.dev/)
*   **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) (utilizando o plugin oficial de integração nativa do Vite)
*   **Gerenciamento de Estado**: [Zustand](https://zustand.docs.pmnd.rs/) (com persistência automática em `localStorage`)
*   **Feedback Visual e Alertas**: [Sonner](https://sonner.emilkowal.ski/) (notificações do tipo Toast elegantes e sem travamentos)
*   **Iconografia**: [Lucide React](https://lucide.dev/)
*   **Roteamento**: [React Router DOM v7](https://reactrouter.com/)
*   **Suíte de Testes**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

---

## 🎨 Funcionalidades & Telas

1.  **Autenticação e Multi-tenancy**:
    *   **Login & Registro**: Acesso de inquilinos com suporte a validações locais no input, preenchimento automático de e-mail ao redirecionar após cadastro, e suporte nativo ao envio de notificações via **Sonner**.
2.  **Dashboard Administrativo**:
    *   Painel unificado com KPIs (Orçamento Previsto, Custo Realizado, Saldo Restante) e listagens rápidas dos últimos contratos e obras ativas.
3.  **Biblioteca de Modelos (Templates)**:
    *   Criação de templates jurídicos com placeholders dinâmicos (ex: `{{VARIAVEL}}`) para automatizar a redação de contratos.
4.  **Emissor de Contratos (Wizard)**:
    *   Assistente passo a passo para preencher metadados, preencher variáveis de templates em tempo real e visualização em tela dividida (Split Screen Preview) do documento final antes da emissão.
5.  **Detalhes de Contrato**:
    *   Gestão de assinaturas, controle de aditivos (ajustes de prazo e valor) e formulário para cancelamento ou encerramento motivado.
6.  **Portal de Assinatura Pública**:
    *   Tela limpa e segura acessível pelo link externo para coleta do aceite legal e assinatura eletrônica sob as diretrizes da **MP 2.200-2/2001**.
7.  **Gestão de Obras & Vistorias**:
    *   Status por etapas (Planejamento, Execução, Entrega), acompanhamento orçamentário gráfico e upload de comprovantes ou fotos de vistoria direto para o storage.
8.  **Ordem de Compra (PO)**:
    *   Emissor de pedidos de compras de insumos e suprimentos com cálculo em tempo real de subtotais e totais de rodapé.
9.  **Gestão de Usuários**:
    *   Controle de acesso baseado em papéis (`ADMIN`, `EDITOR`, `VIEWER`) da empresa inquilina.

---

## 📁 Estrutura de Pastas

A estrutura interna do diretório `src/` está organizada de forma modular:

```text
frontend
|__ src
    |__ components
    |   |__ Button.tsx          # Componente reutilizável de botões (variantes UI)
    |   |__ Card.tsx            # Painel com efeito de transparência (Glassmorphism)
    |   |__ Input.tsx           # Inputs padronizados com controle de validações
    |   |__ Navbar.tsx          # Menu superior de navegação da área logada
    |
    |__ context
    |   |__ store.ts            # Gerenciamento global de autenticação (Zustand)
    |   |__ store.test.ts       # Testes unitários da store
    |
    |__ screens
    |   |__ Dashboard.tsx       # Tela inicial do painel do inquilino
    |   |__ Login.tsx           # Tela de autenticação
    |   |__ Register.tsx        # Tela de registro de novas empresas
    |   |__ Templates.tsx       # Tela de gerenciamento de modelos de contratos
    |   |__ Contracts.tsx       # Listagem de contratos emitidos
    |   |__ CreateContract.tsx  # Wizard emissor de contratos com split screen
    |   |__ ContractDetails.tsx # Detalhamento, aditivos e encerramento
    |   |__ SignContract.tsx    # Tela externa e pública de assinatura eletrônica
    |   |__ Obras.tsx           # Painel de acompanhamento de obras ativas
    |   |__ ObraDetails.tsx     # Checklists de fases, custos e vistorias da obra
    |   |__ CreatePurchaseOrder.tsx # Emissor de ordens de compras (PO)
    |   |__ Users.tsx           # Listagem e criação de membros com permissões
    |
    |__ utils
    |   |__ formatters.ts       # Funções utilitárias de máscaras (CNPJ, R$, Fone)
    |
    |__ App.tsx                 # Rotas da aplicação (públicas e privadas)
    |__ index.css               # Folha de estilos global (inclui tokens e Tailwind)
    |__ main.tsx                # Inicializador do React DOM no browser
```

---

## ⚙️ Como Executar o Projeto

### Pré-requisitos
Certifique-se de ter instalado o **Node.js** (versão 18 ou superior) e o gerenciador de pacotes **npm** ou **yarn**.

### 1. Instalação das Dependências
Navegue até o diretório do frontend e instale as dependências:
```bash
npm install
```

### 2. Executar em Desenvolvimento (Local Dev Server)
Para rodar a aplicação localmente:
```bash
npm run dev
```
O servidor será inicializado no endereço [http://localhost:5173/](http://localhost:5173/).

### 3. Rodar a Suíte de Testes
Para executar os testes unitários do frontend utilizando o Vitest:
```bash
npm run test
```

### 4. Compilar para Produção (Build)
Para gerar os arquivos estáticos compilados e otimizados na pasta `dist/`:
```bash
npm run build
```
