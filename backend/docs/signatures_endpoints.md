# Assinaturas

Endpoints para solicitação e execução de assinaturas eletrônicas de contratos.

---

## POST /v1/contracts/:uuid/signature-request

Envia o contrato para assinatura via e-mail, WhatsApp ou link direto.

**Regras de negócio:**
- O contrato deve estar com status `RASCUNHO` ou `AGUARDANDO_ASSINATURA`.
- Ao realizar o envio, o status do contrato passa para `AGUARDANDO_ASSINATURA`.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID do contrato |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `channel` | string | Sim | `EMAIL`, `WHATSAPP`, `AMBOS` | Canal de envio |
| `expires_at` | string | Não | ISO-8601 | Data de expiração do link (padrão: 7 dias) |

### Response Codes

| Status Code | Descrição |
|---|---|
| **201 Created** | Solicitação de assinatura enviada com sucesso |
| **400 Bad Request** | Canal inválido, contrato já assinado ou dados ausentes |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Contrato não encontrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (201)

```json
{
  "msg": "Solicitação de assinatura enviada com sucesso",
  "signature_request_uuid": "sig11111-aaaa-bbbb-cccc-ddddeeeeffffg",
  "signature_link": "https://app.exemplo.com.br/assinar/tok3nAqu1"
}
```

---

## GET /v1/contracts/:uuid/signature-requests

Lista o histórico de solicitações de assinatura de um contrato.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `uuid` | string (UUID) | UUID do contrato |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Histórico recuperado com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **404 Not Found** | Contrato não encontrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (200)

```json
[
  {
    "uuid": "sig11111-aaaa-bbbb-cccc-ddddeeeeffffg",
    "created_at": "2026-05-01T10:00:00Z",
    "channel": "EMAIL",
    "status": "ASSINADO",
    "signed_at": "2026-05-02T14:35:00Z",
    "expires_at": "2026-05-08T10:00:00Z"
  },
  {
    "uuid": "sig22222-aaaa-bbbb-cccc-ddddeeeeffffg",
    "created_at": "2026-04-20T09:00:00Z",
    "channel": "WHATSAPP",
    "status": "EXPIRADO",
    "signed_at": null,
    "expires_at": "2026-04-27T09:00:00Z"
  }
]
```

---

## POST /v1/sign/:token

**Endpoint público** — não requer autenticação JWT. Permite que a parte relacionada assine o contrato através do link recebido.

### Headers

Nenhum.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `token` | string | Token único do link de assinatura |

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `name` | string | Sim | Nome do assinante (para registro) |
| `ip_address` | string | Não | IP do assinante (capturado pelo servidor) |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Contrato assinado com sucesso |
| **400 Bad Request** | Token inválido ou contrato já assinado |
| **404 Not Found** | Solicitação de assinatura não encontrada |
| **410 Gone** | Link de assinatura expirado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (200)

```json
{
  "msg": "Contrato assinado com sucesso"
}
```

---

## Canais de Assinatura

| Canal | Descrição |
|---|---|
| `EMAIL` | Envia o link de assinatura para o e-mail da parte relacionada |
| `WHATSAPP` | Envia o link de assinatura via mensagem WhatsApp |
| `AMBOS` | Envia simultaneamente via e-mail e WhatsApp |
| `LINK` | Gera apenas o link de assinatura, sem envio automático |

## Status da Solicitação de Assinatura

| Status | Descrição |
|---|---|
| `ENVIADO` | Link enviado, mas ainda não visualizado |
| `VISUALIZADO` | Link acessado pela parte relacionada |
| `ASSINADO` | Contrato assinado com sucesso |
| `EXPIRADO` | Link expirou sem assinatura |
