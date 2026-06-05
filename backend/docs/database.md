# Banco de Dados

Documentação da estrutura do banco de dados PostgreSQL da aplicação. Todos os modelos são definidos via **Prisma ORM**.

**Banco de dados:** PostgreSQL  
**ORM:** Prisma (schema em `prisma/schema.prisma`)

---

## Visão Geral

O banco de dados é estruturado em torno do conceito de **multi-tenancy**: cada registro de dado pertence a uma `Company` (empresa/tenant). A empresa é o ponto central do sistema, ao qual se conectam usuários, templates de contratos, contratos, obras, ordens de compra e logs de auditoria.

```
Company
├── Users               (usuários da empresa)
├── ContractTemplates   (modelos de contratos parametrizáveis)
│   └── ContractTemplateFields
├── Contracts           (contratos gerados)
│   └── SignatureRequests
├── Obras               (obras de construção)
│   ├── ObraSteps
│   ├── ObraVistorias
│   └── ObraCustos
├── PurchaseOrders      (ordens de compra)
│   └── PurchaseOrderItems
├── Uploads             (arquivos anexos)
└── AuditLogs           (trilha de auditoria)
```

---

## Enums

| Enum | Valores | Descrição |
|---|---|---|
| `user_role` | `ADMIN`, `EDITOR`, `VIEWER` | Perfil de acesso do usuário |
| `user_status` | `ATIVO`, `INATIVO` | Status da conta do usuário |
| `contract_type` | `SERVICO`, `TRABALHO`, `OBRA`, `LOCACAO`, `OUTRO` | Tipo de contrato |
| `contract_status` | `RASCUNHO`, `AGUARDANDO_ASSINATURA`, `ASSINADO`, `VENCENDO`, `ENCERRADO` | Status do ciclo de vida do contrato |
| `template_field_type` | `TEXT`, `NUMBER`, `DATE`, `SIGNATURE`, `ADDRESS` | Tipo de campo parametrizável |
| `signature_channel` | `EMAIL`, `WHATSAPP`, `AMBOS`, `LINK` | Canal de envio da solicitação de assinatura |
| `signature_status` | `ENVIADO`, `VISUALIZADO`, `ASSINADO`, `EXPIRADO` | Status da solicitação de assinatura |
| `obra_status` | `PLANEJAMENTO`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA` | Status da obra |
| `obra_phase` | `PLANEJAMENTO`, `EXECUCAO`, `ENTREGA` | Fase de uma etapa da obra |
| `obra_step_status` | `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA` | Status de uma etapa da obra |
| `vistoria_type` | `INICIAL`, `FINAL` | Tipo de vistoria |
| `cost_category` | `MATERIAL`, `MAO_DE_OBRA`, `EQUIPAMENTO`, `SERVICO`, `OUTRO` | Categoria do custo da obra |
| `purchase_order_status` | `RASCUNHO`, `EMITIDA`, `APROVADA`, `CANCELADA` | Status da ordem de compra |
| `audit_action` | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `SIGN`, `SEND` | Tipo de ação registrada na auditoria |

---

## Tabelas

### `companies`

Armazena as empresas (tenants) do sistema. Cada empresa é isolada das demais.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `updated_at` | Timestamptz | Não | `now()` | Data da última atualização |
| `name` | VarChar(255) | Não | — | Razão social da empresa |
| `cnpj` | VarChar(14) | Não | — | CNPJ da empresa (único) |
| `email` | VarChar(255) | Sim | — | E-mail de contato |
| `phone` | VarChar(20) | Sim | — | Telefone de contato |
| `address` | Text | Sim | — | Endereço da empresa |
| `is_active` | Boolean | Não | `true` | Indica se a empresa está ativa |

**Índices:** `cnpj` (unique)

---

### `users`

Usuários vinculados a uma empresa. E-mail é único por empresa.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `updated_at` | Timestamptz | Não | `now()` | Data da última atualização |
| `company_uuid` | UUID | Não | — | **FK** → `companies.uuid` |
| `name` | VarChar(255) | Não | — | Nome do usuário |
| `email` | VarChar(255) | Não | — | E-mail do usuário |
| `password_hash` | VarChar(255) | Não | — | Hash da senha (bcrypt) |
| `role` | user_role | Não | `EDITOR` | Perfil de acesso |
| `status` | user_status | Não | `ATIVO` | Status da conta |

**Índices:** `company_uuid`, `email`  
**Unique:** `(company_uuid, email)`

---

### `contract_templates`

Templates parametrizáveis para geração de contratos.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `updated_at` | Timestamptz | Não | `now()` | Data da última atualização |
| `company_uuid` | UUID | Não | — | **FK** → `companies.uuid` |
| `name` | VarChar(255) | Não | — | Nome do template |
| `type` | contract_type | Não | — | Tipo do template |
| `description` | Text | Sim | — | Descrição do template |
| `body` | Text | Não | — | Corpo do contrato com placeholders `{{chave}}` |
| `is_active` | Boolean | Não | `true` | Indica se o template está ativo |

**Índices:** `company_uuid`, `type`

---

### `contract_template_fields`

Campos parametrizáveis de um template de contrato.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `template_uuid` | UUID | Não | — | **FK** → `contract_templates.uuid` |
| `key` | VarChar(100) | Não | — | Chave do campo (deve corresponder ao placeholder no body) |
| `label` | VarChar(255) | Não | — | Rótulo exibido ao usuário |
| `field_type` | template_field_type | Não | — | Tipo do campo |
| `is_required` | Boolean | Não | `true` | Se o campo é obrigatório |
| `sort_order` | SmallInt | Não | `0` | Ordem de exibição |

**Unique:** `(template_uuid, key)`  
**Índices:** `template_uuid`

---

### `contracts`

Contratos gerados pelas empresas, com suporte a aditivos (contratos derivados).

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `updated_at` | Timestamptz | Não | `now()` | Data da última atualização |
| `company_uuid` | UUID | Não | — | **FK** → `companies.uuid` |
| `template_uuid` | UUID | Sim | — | **FK** → `contract_templates.uuid` |
| `created_by_uuid` | UUID | Sim | — | **FK** → `users.uuid` |
| `title` | VarChar(255) | Não | — | Título do contrato |
| `type` | contract_type | Não | — | Tipo do contrato |
| `status` | contract_status | Não | `RASCUNHO` | Status atual |
| `related_party` | VarChar(255) | Não | — | Nome/razão social da parte relacionada |
| `related_party_email` | VarChar(255) | Não | — | E-mail da parte relacionada |
| `related_party_whatsapp` | VarChar(20) | Sim | — | WhatsApp da parte relacionada |
| `value` | BigInt | Sim | — | Valor do contrato **em centavos** |
| `start_date` | Date | Sim | — | Data de início da vigência |
| `end_date` | Date | Sim | — | Data de término da vigência |
| `body` | Text | Não | — | Corpo do contrato com campos preenchidos |
| `field_values` | JSON | Sim | — | Mapa dos campos preenchidos |
| `close_reason` | Text | Sim | — | Motivo do encerramento |
| `origin_contract_uuid` | UUID | Sim | — | **FK** → `contracts.uuid` (para aditivos) |

> **Nota monetária:** O campo `value` é armazenado como `BigInt` em **centavos** (ex: R$ 3.500,00 = `350000`).

**Índices:** `company_uuid`, `status`, `type`, `end_date`, `related_party`

---

### `signature_requests`

Solicitações de assinatura eletrônica associadas a contratos.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `updated_at` | Timestamptz | Não | `now()` | Data da última atualização |
| `contract_uuid` | UUID | Não | — | **FK** → `contracts.uuid` |
| `channel` | signature_channel | Não | — | Canal de envio |
| `status` | signature_status | Não | `ENVIADO` | Status da solicitação |
| `token` | VarChar(255) | Não | — | Token único do link (único) |
| `expires_at` | Timestamptz | Não | — | Data de expiração do link |
| `signed_at` | Timestamptz | Sim | — | Data/hora em que foi assinado |
| `signer_name` | VarChar(255) | Sim | — | Nome do assinante (registrado na assinatura) |
| `signer_ip` | VarChar(45) | Sim | — | IP do assinante (registrado na assinatura) |

**Unique:** `token`  
**Índices:** `contract_uuid`, `token`, `status`

---

### `obras`

Obras de construção civil vinculadas a uma empresa e, opcionalmente, a um contrato.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `updated_at` | Timestamptz | Não | `now()` | Data da última atualização |
| `company_uuid` | UUID | Não | — | **FK** → `companies.uuid` |
| `contract_uuid` | UUID | Sim | — | **FK** → `contracts.uuid` |
| `created_by_uuid` | UUID | Sim | — | **FK** → `users.uuid` |
| `name` | VarChar(255) | Não | — | Nome da obra |
| `address` | Text | Não | — | Endereço completo da obra |
| `description` | Text | Sim | — | Descrição geral |
| `status` | obra_status | Não | `PLANEJAMENTO` | Status atual |
| `start_date` | Date | Sim | — | Data prevista de início |
| `end_date` | Date | Sim | — | Data prevista de conclusão |
| `budget_total` | BigInt | Sim | — | Orçamento total previsto **em centavos** |
| `responsible_cnpj` | VarChar(14) | Sim | — | CNPJ do responsável |

**Índices:** `company_uuid`, `status`, `contract_uuid`

---

### `obra_steps`

Etapas do roteiro de execução de uma obra.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `updated_at` | Timestamptz | Não | `now()` | Data da última atualização |
| `obra_uuid` | UUID | Não | — | **FK** → `obras.uuid` |
| `name` | VarChar(255) | Não | — | Nome da etapa |
| `phase` | obra_phase | Não | — | Fase da etapa |
| `status` | obra_step_status | Não | `PENDENTE` | Status da etapa |
| `sort_order` | SmallInt | Não | `0` | Ordem de exibição |
| `completed_at` | Timestamptz | Sim | — | Data/hora de conclusão |

**Índices:** `obra_uuid`, `phase`

---

### `obra_vistorias`

Registros de vistoria (inicial ou final) de obras.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `obra_uuid` | UUID | Não | — | **FK** → `obras.uuid` |
| `created_by_uuid` | UUID | Sim | — | **FK** → `users.uuid` |
| `type` | vistoria_type | Não | — | Tipo da vistoria |
| `description` | Text | Sim | — | Descrição/observações |

> **Nota:** As fotos de vistoria são armazenadas na tabela `uploads` com `entity_type = 'obra_vistoria'`.

**Índices:** `obra_uuid`, `type`

---

### `obra_custos`

Lançamentos de custos realizados em uma obra.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `obra_uuid` | UUID | Não | — | **FK** → `obras.uuid` |
| `created_by_uuid` | UUID | Sim | — | **FK** → `users.uuid` |
| `description` | VarChar(255) | Não | — | Descrição do custo |
| `category` | cost_category | Não | — | Categoria do custo |
| `value` | BigInt | Não | — | Valor do custo **em centavos** |
| `date` | Date | Não | — | Data da despesa |

**Índices:** `obra_uuid`, `category`, `date`

---

### `purchase_orders`

Ordens de compra associadas a uma obra e empresa.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `updated_at` | Timestamptz | Não | `now()` | Data da última atualização |
| `company_uuid` | UUID | Não | — | **FK** → `companies.uuid` |
| `obra_uuid` | UUID | Sim | — | **FK** → `obras.uuid` |
| `created_by_uuid` | UUID | Sim | — | **FK** → `users.uuid` |
| `number` | VarChar(50) | Não | — | Número sequencial da O.C. (ex: `OC-2026-0001`) |
| `status` | purchase_order_status | Não | `RASCUNHO` | Status atual |
| `supplier_name` | VarChar(255) | Não | — | Nome do fornecedor |
| `supplier_cnpj` | VarChar(14) | Sim | — | CNPJ do fornecedor |
| `payer_cnpj` | VarChar(14) | Não | — | CNPJ do pagador |
| `delivery_date` | Date | Sim | — | Data prevista de entrega |
| `notes` | Text | Sim | — | Observações gerais |

**Unique:** `(company_uuid, number)`  
**Índices:** `company_uuid`, `obra_uuid`, `status`

---

### `purchase_order_items`

Itens individuais de uma ordem de compra.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `purchase_order_uuid` | UUID | Não | — | **FK** → `purchase_orders.uuid` |
| `description` | VarChar(255) | Não | — | Descrição do item |
| `quantity` | Decimal(12,3) | Não | — | Quantidade |
| `unit` | VarChar(20) | Não | — | Unidade de medida (ex: `UN`, `M2`, `KG`) |
| `unit_price` | BigInt | Não | — | Preço unitário **em centavos** |
| `total_price` | BigInt | Não | `dbgenerated()` | Preço total calculado (quantity × unit_price) **em centavos** |

**Índices:** `purchase_order_uuid`

---

### `uploads`

Armazena metadados de arquivos enviados (documentos de contratos, fotos de vistoria, comprovantes de custo etc).

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `company_uuid` | UUID | Não | — | **FK** → `companies.uuid` |
| `entity_type` | VarChar(50) | Não | — | Tipo da entidade vinculada (ex: `contract`, `obra_vistoria`, `obra_custo`) |
| `entity_uuid` | UUID | Não | — | UUID da entidade vinculada |
| `file_name` | VarChar(255) | Não | — | Nome original do arquivo |
| `file_url` | Text | Não | — | URL de acesso ao arquivo (CDN/storage) |
| `mime_type` | VarChar(100) | Sim | — | Tipo MIME do arquivo |
| `size_bytes` | BigInt | Sim | — | Tamanho do arquivo em bytes |

**Índices:** `(entity_type, entity_uuid)`, `company_uuid`

---

### `audit_logs`

Trilha de auditoria de todas as ações realizadas no sistema.

| Coluna | Tipo | Nullable | Padrão | Descrição |
|---|---|---|---|---|
| `uuid` | UUID | Não | `uuid_generate_v4()` | **PK** — Identificador único |
| `created_at` | Timestamptz | Não | `now()` | Data de criação |
| `company_uuid` | UUID | Não | — | **FK** → `companies.uuid` |
| `user_uuid` | UUID | Sim | — | **FK** → `users.uuid` |
| `action` | audit_action | Não | — | Tipo de ação |
| `entity_type` | VarChar(50) | Não | — | Tipo da entidade afetada |
| `entity_uuid` | UUID | Sim | — | UUID da entidade afetada |
| `description` | Text | Sim | — | Descrição legível da ação |
| `metadata` | JSON | Sim | — | Dados adicionais da ação (diff, parâmetros etc) |
| `ip_address` | VarChar(45) | Sim | — | IP do usuário no momento da ação |

**Índices:** `company_uuid`, `(entity_type, entity_uuid)`, `user_uuid`, `created_at DESC`

---

## Diagrama de Relacionamentos

```
companies (1) ─── (N) users
companies (1) ─── (N) contract_templates
  contract_templates (1) ─── (N) contract_template_fields
companies (1) ─── (N) contracts
  contracts (N) ─── (1) contract_templates  [opcional]
  contracts (1) ─── (N) signature_requests
  contracts (1) ─── (N) contracts           [aditivos: origin_contract_uuid]
companies (1) ─── (N) obras
  obras (N) ─── (1) contracts               [opcional]
  obras (1) ─── (N) obra_steps
  obras (1) ─── (N) obra_vistorias
  obras (1) ─── (N) obra_custos
companies (1) ─── (N) purchase_orders
  purchase_orders (N) ─── (1) obras         [opcional]
  purchase_orders (1) ─── (N) purchase_order_items
companies (1) ─── (N) uploads
companies (1) ─── (N) audit_logs
```

---

## Convenções

| Convenção | Padrão |
|---|---|
| **Identificadores** | UUID v4 gerado pelo banco de dados (`uuid_generate_v4()`) |
| **Datas** | `Timestamptz` para timestamps com timezone; `Date` para campos de data simples |
| **Valores Monetários** | `BigInt` armazenado em **centavos** (ex: R$ 1,00 = `100`) |
| **Soft Delete** | Não utilizado — registros são fisicamente deletados com `onDelete: Cascade` |
| **Nomes de Tabelas** | snake_case, plural (ex: `contract_templates`, `obra_custos`) |
| **Nomes de Colunas** | snake_case (ex: `company_uuid`, `created_at`) |

---

*Última atualização: Junho/2026*
