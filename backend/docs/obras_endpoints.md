# Obras

Endpoints para gerenciamento do ciclo de vida completo de obras de construção.

**Base URL:** `/v1/obras`

> **Autenticação:** Todos os endpoints exigem o header `Authorization: Bearer <token>`.

---

## GET /v1/obras

Lista todas as obras da empresa autenticada.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `status` | string | Não | Filtra por status: `PLANEJAMENTO`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA` |
| `search` | string | Não | Busca por nome ou endereço da obra |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Obras recuperadas com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

Array de objetos de obra resumida:

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `created_at` | string (ISO 8601) | Não | Data de criação |
| `name` | string | Não | Nome da obra |
| `address` | string | Não | Endereço da obra |
| `status` | string | Não | Status atual |
| `start_date` | string (date) | Sim | Data prevista de início |
| `end_date` | string (date) | Sim | Data prevista de conclusão |
| `budget_total` | integer | Sim | Orçamento total previsto (em centavos) |
| `cost_total` | integer | Não | Total de custos realizados (em centavos) |
| `contract_uuid` | string (UUID) | Sim | UUID do contrato vinculado |

---

## POST /v1/obras

Cria uma nova obra vinculada à empresa autenticada.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `name` | string | Sim | — | Nome da obra |
| `address` | string | Sim | — | Endereço completo da obra |
| `description` | string | Não | — | Descrição geral da obra |
| `start_date` | string | Não | ISO-8601 (data) | Data prevista de início |
| `end_date` | string | Não | ISO-8601 (data) | Data prevista de conclusão |
| `budget_total` | integer | Não | — | Orçamento total previsto (em centavos) |
| `contract_uuid` | string | Não | UUID válido | UUID do contrato vinculado |
| `responsible_cnpj` | string | Não | 14 dígitos | CNPJ do responsável/empresa pagadora |

### Response Codes

| Status Code | Descrição |
|---|---|
| **201 Created** | Obra criada com sucesso |
| **400 Bad Request** | Dados inválidos |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Contrato vinculado não encontrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (201)

```json
{
  "msg": "Obra criada com sucesso",
  "uuid": "obra1111-aaaa-bbbb-cccc-ddddeeeeffffg"
}
```

---

## GET /v1/obras/:uuid

Recupera os detalhes completos de uma obra, incluindo etapas, custos, vistorias e ordens de compra.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID da obra |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Obra recuperada com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Obra não encontrada |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `created_at` | string (ISO 8601) | Não | Data de criação |
| `name` | string | Não | Nome da obra |
| `address` | string | Não | Endereço da obra |
| `description` | string | Sim | Descrição geral |
| `status` | string | Não | Status: `PLANEJAMENTO`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA` |
| `start_date` | string (date) | Sim | Data prevista de início |
| `end_date` | string (date) | Sim | Data prevista de conclusão |
| `budget_total` | integer | Sim | Orçamento total previsto (em centavos) |
| `cost_total` | integer | Não | Total de custos realizados (em centavos) |
| `responsible_cnpj` | string | Sim | CNPJ do responsável |
| `contract_uuid` | string (UUID) | Sim | UUID do contrato vinculado |
| `steps` | array | Não | Etapas do roteiro da obra |
| `vistorias` | array | Não | Registros de vistoria |
| `costs` | array | Não | Lançamentos de custo |
| `purchase_orders` | array | Não | Ordens de compra vinculadas |

**`steps[]` (etapa da obra)**

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `name` | string | Não | Nome da etapa |
| `phase` | string | Não | Fase: `PLANEJAMENTO`, `EXECUCAO`, `ENTREGA` |
| `status` | string | Não | Status: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA` |
| `order` | integer | Não | Ordem de exibição |
| `completed_at` | string (ISO 8601) | Sim | Data de conclusão |

**`vistorias[]` (registro de vistoria)**

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `type` | string | Não | Tipo: `INICIAL`, `FINAL` |
| `description` | string | Sim | Descrição/observações |
| `created_at` | string (ISO 8601) | Não | Data do registro |
| `photos_url` | array\<string\> | Sim | URLs das fotos |

**`costs[]` (lançamento de custo)**

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `created_at` | string (ISO 8601) | Não | Data do lançamento |
| `description` | string | Não | Descrição do custo |
| `category` | string | Não | Categoria: `MATERIAL`, `MAO_DE_OBRA`, `EQUIPAMENTO`, `SERVICO`, `OUTRO` |
| `value` | integer | Não | Valor (em centavos) |
| `date` | string (date) | Não | Data da despesa |

**`purchase_orders[]` (ordem de compra resumida)**

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `number` | string | Não | Número da O.C. |
| `status` | string | Não | Status: `RASCUNHO`, `EMITIDA`, `APROVADA`, `CANCELADA` |
| `total_value` | integer | Não | Valor total (em centavos) |
| `created_at` | string (ISO 8601) | Não | Data de criação |

---

## PATCH /v1/obras/:uuid

Atualiza dados gerais de uma obra.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID da obra |

### Request Body (todos opcionais)

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome da obra |
| `description` | string | Descrição geral |
| `status` | string | Novo status |
| `start_date` | string | Data de início |
| `end_date` | string | Data de conclusão |
| `budget_total` | integer | Orçamento total (em centavos) |
| `responsible_cnpj` | string | CNPJ do responsável |
| `contract_uuid` | string | UUID do contrato a vincular |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Obra atualizada com sucesso |
| **400 Bad Request** | Dados inválidos |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Obra não encontrada |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (200)

```json
{
  "msg": "Obra atualizada com sucesso"
}
```

---

## POST /v1/obras/:uuid/steps

Adiciona uma nova etapa ao roteiro de uma obra.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID da obra |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `name` | string | Sim | — | Nome da etapa |
| `phase` | string | Sim | Enum válido | Fase: `PLANEJAMENTO`, `EXECUCAO`, `ENTREGA` |
| `order` | integer | Não | — | Ordem de exibição (padrão: último) |

### Response Example (201)

```json
{
  "msg": "Etapa criada com sucesso"
}
```

---

## PATCH /v1/obras/:obra_uuid/steps/:step_uuid

Atualiza o status ou dados de uma etapa de obra.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `obra_uuid` | string (UUID) | UUID da obra |
| `step_uuid` | string (UUID) | UUID da etapa |

### Request Body

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome da etapa |
| `status` | string | Novo status: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA` |
| `order` | integer | Nova ordem |

---

## POST /v1/obras/:uuid/vistorias

Registra uma vistoria (inicial ou final) em uma obra.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID da obra |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `type` | string | Sim | `INICIAL`, `FINAL` | Tipo da vistoria |
| `description` | string | Não | — | Descrição/observações |
| `photos_base64` | array | Não | Máx. 20 fotos (5MB/cada) | Fotos em base64 |

### Response Example (201)

```json
{
  "msg": "Vistoria registrada com sucesso",
  "uuid": "vis11111-aaaa-bbbb-cccc-ddddeeeeffffg"
}
```

---

## POST /v1/obras/:uuid/costs

Lança um custo em uma obra.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID da obra |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `description` | string | Sim | — | Descrição do custo |
| `category` | string | Sim | Enum válido | Categoria: `MATERIAL`, `MAO_DE_OBRA`, `EQUIPAMENTO`, `SERVICO`, `OUTRO` |
| `value` | integer | Sim | Positivo | Valor (em centavos) |
| `date` | string | Sim | ISO-8601 (data) | Data da despesa |
| `receipt_base64` | string | Não | Máx. 5MB | Comprovante em base64 |

### Response Example (201)

```json
{
  "msg": "Custo lançado com sucesso"
}
```

---

## DELETE /v1/obras/:obra_uuid/costs/:cost_uuid

Remove um lançamento de custo de uma obra.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `obra_uuid` | string (UUID) | UUID da obra |
| `cost_uuid` | string (UUID) | UUID do custo |

### Response Example (200)

```json
{
  "msg": "Custo removido com sucesso"
}
```

---

## Status de Obras

| Status | Descrição |
|---|---|
| `PLANEJAMENTO` | Obra em fase de planejamento |
| `EM_EXECUCAO` | Obra em andamento |
| `CONCLUIDA` | Obra finalizada |
| `CANCELADA` | Obra cancelada |
