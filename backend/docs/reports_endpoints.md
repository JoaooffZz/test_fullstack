# Dashboard & Relatórios

Endpoints para consulta de métricas gerenciais e geração de relatórios exportáveis.

**Base URL:** `/v1`

> **Autenticação:** Todos os endpoints exigem o header `Authorization: Bearer <token>`.

---

## GET /v1/dashboard

Retorna as métricas consolidadas (KPIs) para o dashboard principal da empresa autenticada.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Métricas recuperadas com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `contracts` | object | Não | KPIs de contratos |
| `contracts.total` | integer | Não | Total de contratos |
| `contracts.active` | integer | Não | Contratos ativos (`ASSINADO`) |
| `contracts.expiring_soon` | integer | Não | Contratos vencendo nos próximos 30 dias |
| `contracts.awaiting_signature` | integer | Não | Contratos aguardando assinatura |
| `contracts.expired` | integer | Não | Contratos encerrados/vencidos |
| `obras` | object | Não | KPIs de obras |
| `obras.total` | integer | Não | Total de obras |
| `obras.in_progress` | integer | Não | Obras em execução |
| `obras.concluded` | integer | Não | Obras concluídas |
| `obras.total_budget` | integer | Não | Soma dos orçamentos previstos (em centavos) |
| `obras.total_cost` | integer | Não | Soma dos custos realizados (em centavos) |
| `purchase_orders` | object | Não | KPIs de ordens de compra |
| `purchase_orders.total` | integer | Não | Total de O.C.s |
| `purchase_orders.pending_approval` | integer | Não | O.C.s aguardando aprovação |
| `recent_contracts` | array | Não | Últimos 5 contratos criados/atualizados |
| `recent_obras` | array | Não | Últimas 5 obras criadas/atualizadas |

### Response Example (200)

```json
{
  "contracts": {
    "total": 42,
    "active": 30,
    "expiring_soon": 4,
    "awaiting_signature": 5,
    "expired": 3
  },
  "obras": {
    "total": 12,
    "in_progress": 7,
    "concluded": 4,
    "total_budget": 85000000,
    "total_cost": 52000000
  },
  "purchase_orders": {
    "total": 28,
    "pending_approval": 6
  },
  "recent_contracts": [],
  "recent_obras": []
}
```

---

## GET /v1/reports/contracts

Gera relatório exportável de contratos com filtros avançados.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `status` | string | Não | Filtra por status |
| `type` | string | Não | Filtra por tipo |
| `start_date_from` | string | Não | Data de início da vigência (de) — formato ISO-8601 |
| `start_date_to` | string | Não | Data de início da vigência (até) — formato ISO-8601 |
| `format` | string | Não | Formato de saída: `json` (padrão) ou `csv` |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Relatório gerado com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

> **Nota:** Quando `format=csv`, o `Content-Type` da resposta será `text/csv` e o corpo será o arquivo para download direto.

---

## GET /v1/reports/obras

Gera relatório exportável de obras com controle orçamentário.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `status` | string | Não | Filtra por status da obra |
| `format` | string | Não | Formato de saída: `json` (padrão) ou `csv` |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Relatório gerado com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

> **Nota:** Quando `format=csv`, o `Content-Type` da resposta será `text/csv` e o corpo será o arquivo para download direto.
