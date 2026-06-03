# Camada de Casos de Uso (Application / Use Cases)

Esta camada contém as regras de negócio específicas da aplicação e orquestra o fluxo de dados.

## Conteúdo
- Classes de caso de uso (ex: `CreateProductUseCase`, `AuthenticateUserUseCase`).
- DTOs (Data Transfer Objects) para entrada e saída de dados.

## Regras
- Depende apenas do Domínio e das Portas (interfaces).
- Não conhece implementações concretas (como Express ou Prisma).
