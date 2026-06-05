# Autenticação

Endpoints relacionados ao registro e login de empresas e usuários.

**Base URL:** `/v1/auth`

---

## POST /v1/auth/register

Registra uma nova empresa (tenant) e seu usuário administrador.

### Headers

Nenhum.

### Request Body

| Campo | Tipo | Obrigatório | Validação | Descrição |
|---|---|---|---|---|
| `company_name` | string | Sim | — | Razão social da empresa |
| `cnpj` | string | Sim | 14 dígitos | CNPJ da empresa |
| `user_name` | string | Sim | — | Nome do usuário administrador |
| `email` | string | Sim | Formato e-mail | E-mail do usuário |
| `password` | string | Sim | Mín. 8 chars | Senha do usuário |

### Request Body Example

```json
{
  "company_name": "Construtora Exemplo LTDA",
  "cnpj": "12345678000190",
  "user_name": "Carlos Souza",
  "email": "carlos@exemplo.com.br",
  "password": "senha1234"
}
```

### Response Codes

| Status Code | Descrição |
|---|---|
| **201 Created** | Empresa e usuário criados com sucesso |
| **400 Bad Request** | Dados de entrada inválidos ou malformados |
| **409 Conflict** | CNPJ ou e-mail já cadastrado |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Example (201)

```json
{
  "msg": "Empresa registrada com sucesso"
}
```

---

## POST /v1/auth/login

Autentica um usuário e retorna o token JWT para uso nas demais requisições.

### Headers

Nenhum.

### Request Body

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `email` | string | Sim | E-mail do usuário |
| `password` | string | Sim | Senha do usuário |

### Request Body Example

```json
{
  "email": "carlos@exemplo.com.br",
  "password": "senha1234"
}
```

### Response Codes

| Status Code | Descrição |
|---|---|
| **200 OK** | Login realizado com sucesso |
| **400 Bad Request** | Campos obrigatórios ausentes |
| **401 Unauthorized** | Credenciais inválidas |
| **500 Internal Server Error** | Erro interno do servidor |

### Response Fields

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `token` | string | Não | JWT para uso nas requisições autenticadas |
| `user` | object | Não | Dados básicos do usuário autenticado |
| `user.uuid` | string (UUID) | Não | Identificador único do usuário |
| `user.name` | string | Não | Nome do usuário |
| `user.email` | string | Não | E-mail do usuário |
| `user.role` | string | Não | Perfil: `ADMIN`, `EDITOR`, `VIEWER` |
| `company` | object | Não | Dados básicos da empresa |
| `company.uuid` | string (UUID) | Não | Identificador único da empresa |
| `company.name` | string | Não | Razão social da empresa |

### Response Example (200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uuid": "aaa11111-bbbb-cccc-dddd-eeeeffffgggg",
    "name": "Carlos Souza",
    "email": "carlos@exemplo.com.br",
    "role": "ADMIN"
  },
  "company": {
    "uuid": "fff99999-aaaa-bbbb-cccc-ddddeeeeffffg",
    "name": "Construtora Exemplo LTDA"
  }
}
```

---

> **Nota de Segurança:** O token JWT retornado deve ser enviado no header `Authorization: Bearer <token>` em todas as requisições autenticadas. O token tem validade definida pela configuração `JWT_EXPIRES_IN` no ambiente.
