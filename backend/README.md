# Sistema de Controle de Contratos & Gestão Orçamentária (Backend)

Este diretório contém o backend do Sistema de Controle de Contratos e Gestão Orçamentária. Esta aplicação fornece uma API REST multi-tenant para gerenciamento de contratos, assinaturas eletrônicas, controle de obras, orçamentos e ordens de compra.

---

## ⚠️ AVISO IMPORTANTE: Ambiente de Testes & Mocks

Para viabilizar o teste prático de ponta a ponta e a validação do fluxo de negócios em ambiente local/desenvolvimento:
1. **Disparo de Link por E-mail**: O serviço de envio de notificações de assinatura está utilizando o **Nodemailer** integrado com o **Ethereal Email** (provedor SMTP gratuito para testes). O log do servidor exibirá uma URL de visualização da caixa de entrada do e-mail simulado.
2. **Disparo por WhatsApp**: Este canal está **mockado**. Ao solicitar o disparo via WhatsApp, o backend registrará apenas um log detalhado no console do terminal informando o destinatário e a mensagem correspondente.
3. **Assinatura Eletrônica**: O módulo de assinatura eletrônica é uma **simulação simplificada**. Ele registra e armazena os dados do signatário (Nome completo, Timestamp e Endereço IP do dispositivo) para fins de log de auditoria, **não utilizando** certificados digitais reais (como ICP-Brasil ou chaves privadas/criptográficas complexas).

---

## 🚀 Tecnologias Utilizadas

*   **Runtime**: Node.js
*   **Linguagem**: TypeScript
*   **Framework Web**: Express.js (v5)
*   **Banco de Dados**: PostgreSQL
*   **ORM**: Prisma
*   **Ambiente**: Docker & Docker Compose
*   **Autenticação**: JWT (JSON Web Tokens)
*   **Disparo de E-mails**: Nodemailer + Ethereal SMTP

---

## ⚙️ Principais Funcionalidades

1.  **Multi-Tenancy e Permissões**: Isolamento completo de dados por empresa (inquilinos/tenants) utilizando chaves estrangeiras. Controle de acesso baseado em papéis (`ADMIN`, `EDITOR`, `VIEWER`).
2.  **Modelos de Contrato (Templates)**: Criação de modelos com placeholders dinâmicos (`{{variavel}}`) para autogeração de documentos.
3.  **Gestão do Ciclo de Contratos**: Status dinâmicos (`RASCUNHO`, `AGUARDANDO_ASSINATURA`, `ASSINADO`, `VIGENTE`, `ENCERRADO`).
4.  **Emissão de Links de Assinatura**: Coleta e validação pública de tokens de assinatura.
5.  **Acompanhamento de Obras**: Gestão de checklists, lançamentos de custos/despesas reais e monitoramento orçamentário.
6.  **Ordens de Compra (PO)**: Criação e controle de pedidos de compra integrados aos custos da obra.
7.  **Relatórios**: Consolidação de KPIs em dashboards com suporte à exportação de planilhas.

---

## 📁 Estrutura de Pastas

A arquitetura do backend segue uma abordagem inspirada em **Clean Architecture** (Arquitetura Limpa), dividida de forma modular:

```text
backend
|__ prisma
|   |__ schema.prisma            # Definição das tabelas do banco PostgreSQL
|   |__ seed.ts                  # Massa de dados de teste inicial
|
|__ src
|   |__ adapters                 # Controladores e adaptadores de entrada do Express
|   |   |__ controllers          # Processamento das requisições e respostas HTTP
|   |
|   |__ application              # Casos de uso (Use Cases) da regra de negócio
|   |   |__ use-cases            # Implementações dos fluxos (ex: ExecuteSignature)
|   |
|   |__ core                     # Camada mais interna (Domínio e interfaces)
|   |   |__ domain               # Entidades de negócio (ex: Contract, Obra)
|   |   |__ ports                # Interfaces de repositórios e serviços de infra
|   |
|   |__ generated                # Códigos auto-gerados (ex: Cliente Prisma)
|   |
|   |__ infrastructure           # Serviços de infraestrutura externa e persistência
|   |   |__ database             # Repositórios Prisma implementados
|   |   |__ services             # Envio de e-mail (Nodemailer) e Supabase Storage
|   |
|   |__ routes                   # Mapeamento de rotas e middlewares HTTP do Express
|   |__ utils                    # Funções utilitárias globais
|   |__ app.ts                   # Inicialização do Express
|   |__ index.ts                 # Ponto de entrada do servidor Node.js
|
|__ tests
    |__ e2e                      # Testes ponta a ponta (E2E) com banco real
```

---

## ⚙️ Como Executar o Projeto

### Rodar via Docker (Recomendado)
Para rodar a API junto com o banco PostgreSQL automaticamente:
```bash
docker-compose up --build
```
A API estará disponível no endereço `http://localhost:3001`.

### Rodar Localmente (Desenvolvimento)
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` com suas credenciais do banco de dados local.
3. Gere o client do Prisma e execute as migrações:
   ```bash
   npx prisma migrate dev
   ```
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Executar Testes E2E
Para validar as rotas de ponta a ponta com Vitest:
```bash
npm run test:e2e
```
