# Camada de Portas (Core / Ports)

Esta camada contém as interfaces que definem como o núcleo da aplicação (Domínio e Casos de Uso) se comunica com o mundo externo.

## Conteúdo
- **Repositories**: Interfaces para persistência de dados (ex: `UserRepository`, `ContractRepository`).
- **Services**: Interfaces para serviços externos (ex: `EmailService`, `SmsService`).

## Regras
- Define apenas contratos (interfaces TypeScript).
- Nenhuma implementação concreta deve estar nesta camada.
