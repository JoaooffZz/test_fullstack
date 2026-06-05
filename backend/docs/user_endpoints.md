# Usuários

Endpoints para gerenciamento de usuários vinculados à empresa autenticada.

**Base URL:** `/v1/users`

> **Autenticação:** Todos os endpoints exigem o header `Authorization: Bearer <token>`.

---

## GET /v1/users

Lista todos os usuários da empresa autenticada.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Usuários recuperados com sucesso |
| **401 Unauthorized** | Token ausente ou inválido |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

Array de objetos de usuário:

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `uuid` | string (UUID) | Não | Identificador único do usuário |
| `created_at` | string (ISO 8601) | Não | Data de criação |
| `name` | string | Não | Nome do usuário |
| `email` | string | Não | E-mail do usuário |
| `role` | string | Não | Perfil: `ADMIN`, `EDITOR`, `VIEWER` |
| `status` | string | Não | Status: `ATIVO`, `INATIVO` |

### Response Example (200)

```json
[
  {
    "uuid": "aaa11111-bbbb-cccc-dddd-eeeeffffgggg",
    "created_at": "2026-01-10T10:00:00Z",
    "name": "Carlos Souza",
    "email": "carlos@exemplo.com.br",
    "role": "ADMIN",
    "status": "ATIVO"
  }
]
```

---

## POST /v1/users

Cria um novo usuário vinculado à empresa autenticada.

### Headers

| Header | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Authorization` | string | Sim | Bearer token |

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `name` | string | Sim | — | Nome do usuário |
| `email` | string | Sim | Formato e-mail | E-mail do usuário |
| `password` | string | Sim | Mín. 8 chars | Senha inicial |
| `role` | string | Sim | `ADMIN`, `EDITOR`, `VIEWER` | Perfil de acesso |

### Response Codes

| Status Code | Descrição |
|---|---|
| **201 Created** | Usuário criado com sucesso |
| **400 Bad Request** | Dados inválidos |
| **401 Unauthorized** | Token ausente ou inválido |
| **409 Conflict** | E-mail já cadastrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (201)

```json
{
  "msg": "Usuário criado com sucesso"
}
```

---

## Perfis de Acesso (Roles)

| Role | Descrição |
|---|---|
| `ADMIN` | Acesso total: criação de usuários, contratos, obras, templates e configurações da empresa |
| `EDITOR` | Pode criar e editar contratos, obras, templates e lançamentos; não pode gerenciar usuários |
| `VIEWER` | Somente leitura em todos os recursos |
