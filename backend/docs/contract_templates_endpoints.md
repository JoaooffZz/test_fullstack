# Templates de Contratos

Endpoints para gerenciamento de templates parametrizáveis de contratos.

**Base URL:** `/v1/contract-templates`

> **Autenticação:** Todos os endpoints exigem o header `Authorization: Bearer <token>`.

---

## GET /v1/contract-templates

Lista todos os templates de contrato disponíveis para a empresa autenticada.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `type` | string | Não | Filtra por tipo: `SERVICO`, `TRABALHO`, `OBRA`, `LOCACAO`, `OUTRO` |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Templates recuperados com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

Array de objetos de template:

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único do template |
| `created_at` | string (ISO 8601) | Não | Data de criação |
| `name` | string | Não | Nome do template |
| `type` | string | Não | Tipo: `SERVICO`, `TRABALHO`, `OBRA`, `LOCACAO`, `OUTRO` |
| `description` | string | Sim | Descrição do template |
| `fields` | array | Não | Lista de campos parametrizáveis |

**`fields[]`**

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único do campo |
| `key` | string | Não | Chave do campo (ex: `parte_contratante`) |
| `label` | string | Não | Rótulo exibido ao usuário |
| `type` | string | Não | Tipo: `TEXT`, `NUMBER`, `DATE`, `SIGNATURE`, `ADDRESS` |
| `required` | boolean | Não | Se o campo é obrigatório |

### Response Example (200)

```json
[
  {
    "uuid": "tpl11111-aaaa-bbbb-cccc-ddddeeeeffffg",
    "created_at": "2026-01-01T00:00:00Z",
    "name": "Contrato de Locação Padrão",
    "type": "LOCACAO",
    "description": "Template base para contratos de aluguel residencial e comercial",
    "fields": [
      {
        "uuid": "fld11111-aaaa-bbbb-cccc-ddddeeeeffffg",
        "key": "parte_locadora",
        "label": "Parte Locadora",
        "type": "TEXT",
        "required": true
      },
      {
        "uuid": "fld22222-aaaa-bbbb-cccc-ddddeeeeffffg",
        "key": "valor_aluguel",
        "label": "Valor do Aluguel (R$)",
        "type": "NUMBER",
        "required": true
      }
    ]
  }
]
```

---

## POST /v1/contract-templates

Cria um novo template de contrato para a empresa autenticada.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `name` | string | Sim | — | Nome do template |
| `type` | string | Sim | Enum válido | Tipo do template |
| `description` | string | Não | — | Descrição do template |
| `body` | string | Sim | — | Corpo do contrato em texto/HTML com placeholders `{{chave}}` |
| `fields` | array | Sim | Mín. 1 item | Campos parametrizáveis |
| `fields[].key` | string | Sim | — | Chave do campo (deve corresponder ao placeholder no `body`) |
| `fields[].label` | string | Sim | — | Rótulo exibido ao usuário |
| `fields[].type` | string | Sim | Enum válido | Tipo do campo |
| `fields[].required` | boolean | Sim | — | Se o campo é obrigatório |

### Response Codes

| Status Code | Descrição |
|---|---|
| **201 Created** | Template criado com sucesso |
| **400 Bad Request** | Dados inválidos |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (201)

```json
{
  "msg": "Template criado com sucesso"
}
```

---

## GET /v1/contract-templates/:uuid

Recupera os detalhes completos de um template específico, incluindo o corpo do contrato.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID do template |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Template recuperado com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Template não encontrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

Mesmos campos do `GET /v1/contract-templates`, acrescido de:

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `body` | string | Não | Corpo do contrato com placeholders `{{chave}}` |

---

## Tipos de Campos de Template

| Tipo | Descrição |
|---|---|
| `TEXT` | Campo de texto livre |
| `NUMBER` | Campo numérico |
| `DATE` | Campo de data |
| `SIGNATURE` | Campo de assinatura eletrônica |
| `ADDRESS` | Campo de endereço estruturado |
