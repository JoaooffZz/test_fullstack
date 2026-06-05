# Contratos

Endpoints para gerenciamento do ciclo de vida completo de contratos.

**Base URL:** `/v1/contracts`

> **Autenticação:** Todos os endpoints exigem o header `Authorization: Bearer <token>`.

---

## GET /v1/contracts

Lista todos os contratos da empresa autenticada com suporte a filtros e paginação.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `status` | string | Não | Filtra por status: `RASCUNHO`, `AGUARDANDO_ASSINATURA`, `ASSINADO`, `VENCENDO`, `ENCERRADO` |
| `type` | string | Não | Filtra por tipo de contrato |
| `search` | string | Não | Busca por nome da parte relacionada ou título |
| `page` | integer | Não | Página (padrão: 1) |
| `limit` | integer | Não | Itens por página (padrão: 20) |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Contratos recuperados com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `data` | array | Não | Lista de contratos |
| `total` | integer | Não | Total de registros |
| `page` | integer | Não | Página atual |
| `limit` | integer | Não | Itens por página |

**`data[]` (objeto de contrato resumido)**

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `created_at` | string (ISO 8601) | Não | Data de criação |
| `title` | string | Não | Título do contrato |
| `type` | string | Não | Tipo do contrato |
| `status` | string | Não | Status atual |
| `related_party` | string | Não | Nome/razão social da parte relacionada |
| `value` | integer | Sim | Valor do contrato (em centavos) |
| `start_date` | string (date) | Sim | Data de início da vigência |
| `end_date` | string (date) | Sim | Data de término da vigência |
| `days_remaining` | integer | Sim | Dias restantes até o vencimento (negativo se vencido) |

### Response Example (200)

```json
{
  "data": [
    {
      "uuid": "ctr11111-aaaa-bbbb-cccc-ddddeeeeffffg",
      "created_at": "2026-03-01T00:00:00Z",
      "title": "Contrato de Locação — Sala 305",
      "type": "LOCACAO",
      "status": "ASSINADO",
      "related_party": "Empresa ABC LTDA",
      "value": 350000,
      "start_date": "2026-04-01",
      "end_date": "2027-04-01",
      "days_remaining": 301
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

## POST /v1/contracts

Cria um novo contrato, com status inicial `RASCUNHO`.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `title` | string | Sim | — | Título do contrato |
| `type` | string | Sim | Enum válido | Tipo do contrato |
| `template_uuid` | string | Não | UUID válido | UUID do template base |
| `related_party` | string | Sim | — | Nome/razão social da parte relacionada |
| `related_party_email` | string | Sim | Formato e-mail | E-mail da parte relacionada |
| `related_party_whatsapp` | string | Não | Formato E.164 | WhatsApp da parte relacionada |
| `value` | integer | Não | — | Valor do contrato (em centavos) |
| `start_date` | string | Não | ISO-8601 | Data de início da vigência |
| `end_date` | string | Não | ISO-8601 | Data de término da vigência |
| `body` | string | Sim | — | Corpo do contrato já com campos preenchidos |
| `field_values` | object | Não | — | Mapa chave-valor dos campos preenchidos |
| `files_base64` | array | Não | Máx. 5 arquivos (10MB/cada) | Documentos anexos em base64 |

### Response Codes

| Status Code | Descrição |
|---|---|
| **201 Created** | Contrato criado com sucesso |
| **400 Bad Request** | Dados inválidos |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (201)

```json
{
  "msg": "Contrato criado com sucesso",
  "uuid": "ctr22222-aaaa-bbbb-cccc-ddddeeeeffffg"
}
```

---

## GET /v1/contracts/:uuid

Recupera os detalhes completos de um contrato específico.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID do contrato |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Contrato recuperado com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Contrato não encontrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único |
| `created_at` | string (ISO 8601) | Não | Data de criação |
| `title` | string | Não | Título do contrato |
| `type` | string | Não | Tipo do contrato |
| `status` | string | Não | Status atual |
| `related_party` | string | Não | Nome da parte relacionada |
| `related_party_email` | string | Não | E-mail da parte relacionada |
| `related_party_whatsapp` | string | Sim | WhatsApp da parte relacionada |
| `value` | integer | Sim | Valor em centavos |
| `start_date` | string (date) | Sim | Data de início |
| `end_date` | string (date) | Sim | Data de término |
| `days_remaining` | integer | Sim | Dias restantes até o vencimento |
| `body` | string | Não | Corpo do contrato preenchido |
| `field_values` | object | Sim | Mapa dos campos preenchidos |
| `files_url` | array\<string\> | Sim | URLs dos arquivos anexos |
| `template_uuid` | string (UUID) | Sim | UUID do template base |
| `signature_requests` | array | Não | Histórico de solicitações de assinatura |
| `obra_uuid` | string (UUID) | Sim | UUID da obra vinculada |

**`signature_requests[]`**

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único da solicitação |
| `created_at` | string (ISO 8601) | Não | Data do envio |
| `channel` | string | Não | Canal: `EMAIL`, `WHATSAPP`, `AMBOS` |
| `status` | string | Não | Status: `ENVIADO`, `VISUALIZADO`, `ASSINADO`, `EXPIRADO` |
| `signed_at` | string (ISO 8601) | Sim | Data/hora da assinatura |

---

## PATCH /v1/contracts/:uuid

Atualiza campos editáveis de um contrato com status `RASCUNHO`.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID do contrato |

### Request Body

Todos os campos são opcionais; apenas os campos enviados serão atualizados.

| Campo | Tipo | Descrição |
|---|---|---|
| `title` | string | Título do contrato |
| `related_party` | string | Nome da parte relacionada |
| `related_party_email` | string | E-mail da parte relacionada |
| `related_party_whatsapp` | string | WhatsApp da parte relacionada |
| `value` | integer | Valor em centavos |
| `start_date` | string | Data de início |
| `end_date` | string | Data de término |
| `body` | string | Corpo do contrato |
| `field_values` | object | Mapa dos campos preenchidos |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Contrato atualizado com sucesso |
| **400 Bad Request** | Dados inválidos ou contrato não está em `RASCUNHO` |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Contrato não encontrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (200)

```json
{
  "msg": "Contrato atualizado com sucesso"
}
```

---

## PATCH /v1/contracts/:uuid/close

Encerra um contrato ativo, alterando seu status para `ENCERRADO`.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID do contrato |

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `reason` | string | Não | Motivo do encerramento |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Contrato encerrado com sucesso |
| **400 Bad Request** | Contrato não pode ser encerrado no status atual |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Contrato não encontrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (200)

```json
{
  "msg": "Contrato encerrado com sucesso"
}
```

---

## POST /v1/contracts/:uuid/additive

Gera um aditivo (novo rascunho baseado) a partir de um contrato existente assinado.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID do contrato de origem |

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `title` | string | Não | Título do aditivo (padrão: `"Aditivo — {título original}"`) |
| `changes` | string | Sim | Descrição das alterações do aditivo |

### Response Codes

| Status Code | Descrição |
|---|---|
| **201 Created** | Aditivo criado com sucesso |
| **400 Bad Request** | Contrato de origem não está `ASSINADO` |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Contrato não encontrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (201)

```json
{
  "msg": "Aditivo criado com sucesso",
  "uuid": "ctr33333-aaaa-bbbb-cccc-ddddeeeeffffg"
}
```

---

## Ciclo de Vida do Contrato (Status)

```
RASCUNHO → AGUARDANDO_ASSINATURA → ASSINADO → VENCENDO → ENCERRADO
```

| Status | Descrição |
|---|---|
| `RASCUNHO` | Contrato em edição, ainda não enviado para assinatura |
| `AGUARDANDO_ASSINATURA` | Solicitação de assinatura enviada à parte relacionada |
| `ASSINADO` | Contrato assinado por todas as partes |
| `VENCENDO` | Contrato próximo ao vencimento (30 dias ou menos) |
| `ENCERRADO` | Contrato encerrado, seja por vencimento ou ação manual |
