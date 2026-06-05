# Ordens de Compra

Endpoints para criação e gerenciamento de ordens de compra vinculadas a obras.

**Base URL:** `/v1/purchase-orders`

> **Autenticação:** Todos os endpoints exigem o header `Authorization: Bearer <token>`.

---

## GET /v1/purchase-orders

Lista todas as ordens de compra da empresa autenticada.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `obra_uuid` | string | Não | Filtra por obra |
| `status` | string | Não | Filtra por status: `RASCUNHO`, `EMITIDA`, `APROVADA`, `CANCELADA` |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Ordens de compra recuperadas com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

Array de objetos de O.C.:

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `created_at` | string (ISO 8601) | Não | Data de criação |
| `number` | string | Não | Número sequencial da O.C. (ex: `OC-2026-0001`) |
| `status` | string | Não | Status atual |
| `obra_uuid` | string (UUID) | Sim | UUID da obra vinculada |
| `obra_name` | string | Sim | Nome da obra vinculada |
| `supplier_name` | string | Não | Nome do fornecedor |
| `supplier_cnpj` | string | Sim | CNPJ do fornecedor |
| `payer_cnpj` | string | Não | CNPJ do pagador |
| `total_value` | integer | Não | Valor total (em centavos) |
| `items_count` | integer | Não | Quantidade de itens |

---

## POST /v1/purchase-orders

Cria uma nova ordem de compra vinculada a uma obra.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `obra_uuid` | string | Não | UUID válido | UUID da obra vinculada |
| `supplier_name` | string | Sim | — | Nome do fornecedor |
| `supplier_cnpj` | string | Não | 14 dígitos | CNPJ do fornecedor |
| `payer_cnpj` | string | Sim | 14 dígitos | CNPJ do pagador |
| `delivery_date` | string | Não | ISO-8601 (data) | Data prevista de entrega |
| `notes` | string | Não | — | Observações gerais |
| `items` | array | Sim | Mín. 1 item | Itens da O.C. |
| `items[].description` | string | Sim | — | Descrição do item |
| `items[].quantity` | number | Sim | Positivo | Quantidade |
| `items[].unit` | string | Sim | — | Unidade de medida (ex: `UN`, `M2`, `KG`) |
| `items[].unit_price` | integer | Sim | Positivo | Preço unitário (em centavos) |

### Request Body Example

```json
{
  "obra_uuid": "obra1111-aaaa-bbbb-cccc-ddddeeeeffffg",
  "supplier_name": "Materiais Silva & Filhos",
  "supplier_cnpj": "98765432000111",
  "payer_cnpj": "12345678000190",
  "delivery_date": "2026-07-15",
  "notes": "Entrega no período da manhã",
  "items": [
    {
      "description": "Cimento Portland CP-II 50kg",
      "quantity": 100,
      "unit": "SC",
      "unit_price": 4500
    },
    {
      "description": "Areia média lavada",
      "quantity": 10,
      "unit": "M3",
      "unit_price": 18000
    }
  ]
}
```

### Response Codes

| Status Code | Descrição |
|---|---|
| **201 Created** | Ordem de compra criada com sucesso |
| **400 Bad Request** | Dados inválidos |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Obra vinculada não encontrada |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (201)

```json
{
  "msg": "Ordem de compra criada com sucesso",
  "uuid": "poc11111-aaaa-bbbb-cccc-ddddeeeeffffg",
  "number": "OC-2026-0001"
}
```

---

## GET /v1/purchase-orders/:uuid

Recupera os detalhes completos de uma ordem de compra.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID da O.C. |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Ordem de compra recuperada com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Ordem de compra não encontrada |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

Mesmos campos do `GET /v1/purchase-orders`, acrescido de:

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `delivery_date` | string (date) | Sim | Data prevista de entrega |
| `notes` | string | Sim | Observações gerais |
| `items` | array | Não | Itens da O.C. |
| `items[].uuid` | string (UUID) | Não | Identificador único do item |
| `items[].description` | string | Não | Descrição do item |
| `items[].quantity` | number | Não | Quantidade |
| `items[].unit` | string | Não | Unidade de medida |
| `items[].unit_price` | integer | Não | Preço unitário (em centavos) |
| `items[].total_price` | integer | Não | Preço total do item (em centavos) |

---

## PATCH /v1/purchase-orders/:uuid/status

Atualiza o status de uma ordem de compra.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID da O.C. |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `status` | string | Sim | Enum válido | Novo status: `EMITIDA`, `APROVADA`, `CANCELADA` |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Status atualizado com sucesso |
| **400 Bad Request** | Transição de status inválida |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Ordem de compra não encontrada |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (200)

```json
{
  "msg": "Status da ordem de compra atualizado com sucesso"
}
```

---

## Fluxo de Status das Ordens de Compra

```
RASCUNHO → EMITIDA → APROVADA
                  ↘ CANCELADA
```

| Status | Descrição |
|---|---|
| `RASCUNHO` | O.C. criada mas ainda não enviada ao fornecedor |
| `EMITIDA` | O.C. emitida e enviada ao fornecedor |
| `APROVADA` | O.C. aprovada internamente |
| `CANCELADA` | O.C. cancelada |
