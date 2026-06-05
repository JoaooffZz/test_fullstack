# Sistema de Controle de Contratos & Gestão Orçamentária

Bem-vindo ao repositório do backend do Sistema de Controle de Contratos e Gestão Orçamentária. Esta aplicação fornece uma API robusta para gerenciamento de contratos, assinaturas eletrônicas, controle de obras, orçamentos e ordens de compra, com suporte a multi-tenancy (múltiplas empresas).

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias modernas e escaláveis para garantir performance e manutenibilidade:

- **Node.js**: Ambiente de execução JavaScript/TypeScript no lado do servidor.
- **Express.js**: Framework minimalista e flexível para a construção de APIs.
- **TypeScript**: Superset de JavaScript que adiciona tipagem estática, garantindo maior segurança e menor incidência de bugs.
- **Prisma ORM**: ORM moderno e type-safe para interação com o banco de dados.
- **PostgreSQL**: Sistema de gerenciamento de banco de dados relacional robusto e confiável.
- **Docker & Docker Compose**: Ferramentas para conteinerização, garantindo ambientes de desenvolvimento e produção consistentes.
- **JWT (JSON Web Tokens)**: Padrão para autenticação e autorização seguras.

## ⚙️ Principais Funcionalidades

A API foi desenhada para atender a cenários complexos de gestão empresarial:

1. **Autenticação e Multi-Tenancy**: Suporte a múltiplas empresas (tenants) com usuários administradores, editores e visualizadores. Autenticação baseada em JWT.
2. **Gestão de Templates de Contratos**: Criação de modelos de contratos parametrizáveis com variáveis dinâmicas (`{{chave}}`) que são preenchidas no momento da geração do contrato.
3. **Controle de Contratos**: Gerenciamento do ciclo de vida completo de um contrato (Rascunho, Aguardando Assinatura, Assinado, Vencendo, Encerrado).
4. **Assinaturas Eletrônicas**: Disparo e acompanhamento de solicitações de assinatura via E-mail, WhatsApp ou Link direto.
5. **Gestão de Obras e Orçamentos**: Controle ponta a ponta de obras, englobando roteiros de execução (etapas), lançamentos de custos, registros de vistorias (com anexos fotográficos) e controle orçamentário detalhado.
6. **Ordens de Compra**: Criação, aprovação e controle de ordens de compra associadas a fornecedores e obras específicas.
7. **Dashboards e Relatórios**: Geração de métricas consolidadas (KPIs) para visão gerencial e exportação de relatórios em formatos JSON e CSV.

## 📚 Documentação da API

A documentação detalhada dos endpoints está dividida por domínio no diretório `/docs`:

- [Autenticação](./docs/auth_endpoints.md)
- [Usuários](./docs/user_endpoints.md)
- [Templates de Contratos](./docs/contract_templates_endpoints.md)
- [Contratos](./docs/contracts_endpoints.md)
- [Assinaturas](./docs/signatures_endpoints.md)
- [Obras](./docs/obras_endpoints.md)
- [Etapas de Obras](./docs/obra_steps_endpoints.md)
- [Vistorias de Obras](./docs/obra_vistorias_endpoints.md)
- [Custos de Obras](./docs/obra_costs_endpoints.md)
- [Ordens de Compra](./docs/purchase_orders_endpoints.md)
- [Dashboards e Relatórios](./docs/reports_endpoints.md)

Além disso, temos a documentação da estrutura do Banco de Dados:
- [Banco de Dados](./docs/database.md)

Para padrões e boas práticas de desenvolvimento no projeto, consulte as [Diretrizes de Desenvolvimento](./.mcp/ctx/DEVELOPMENT_GUIDELINES.md).

## 🐳 Como Executar (Local/Docker)

Para rodar a aplicação localmente utilizando o Docker:

1. Clone o repositório.
2. Configure o arquivo `.env` na raiz da pasta `backend` com suas credenciais e configurações de banco.
3. Na pasta `backend`, execute o comando:
   ```bash
   docker-compose up --build
   ```
4. A API estará disponível na porta definida em sua configuração (por padrão, porta `3000`).

## 🧪 Testes

A aplicação utiliza o `Vitest` para execução de testes (unitários, de integração e e2e). Para executar os testes localmente:

```bash
npm install
npm run test
```
