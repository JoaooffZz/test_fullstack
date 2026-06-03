# Camada de Domínio (Core / Domain)

Esta camada contém o núcleo das regras de negócio corporativas.

## Conteúdo
- **Entities**: Objetos de negócios com identidade própria (ex: `User`, `Contract`, `Obra`).
- **Value Objects**: Objetos sem identidade própria definidos por seus atributos.
- **Enums**: Definições de enums de domínio.

## Regras
- **Dependência ZERO** de bibliotecas externas, ORMs (Prisma), frameworks de transporte (Express), etc.
- Apenas TypeScript puro.
