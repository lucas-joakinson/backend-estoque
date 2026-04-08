# 📦 Gerenciador de Estoque - API

Uma API moderna e escalável para controle de estoque, construída com Node.js, Fastify, Prisma ORM e PostgreSQL.

## 🚀 Funcionalidades Principais
- **Autenticação:** Sistema de registro e login com JWT e Bcrypt.
- **Categorias:** Gerenciamento completo de categorias de produtos.
- **Produtos:** Controle detalhado de produtos (SKU, Nome, Categoria).
- **Estoque:** Registro de entradas e saídas com controle de saldo em tempo real.
- **Histórico:** Rastreabilidade total de movimentações (quem fez, quando e por que).
- **Integridade:** Uso de transações de banco de dados para garantir dados corretos.

## 🛠️ Tecnologias Utilizadas
- [Node.js](https://nodejs.org/)
- [Fastify](https://fastify.io/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Zod](https://zod.dev/) (Validação de Dados)
- [JWT](https://jwt.io/) (Autenticação)
- [TypeScript](https://www.typescriptlang.org/)

---

## 🏁 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL rodando

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone <https://github.com/lucas-joakinson/backend-estoque>
   cd gerenciador-de-estoque
   ```

2. **Instalar Dependências:**
   ```bash
   npm install
   ```

3. **Configurar Variáveis de Ambiente:**
   Renomeie o `.env.example` para `.env` e ajuste sua string de conexão:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/estoque_db"
   JWT_SECRET="sua_chave_secreta_aqui"
   PORT=3000
   ```

4. **Preparar o Banco de Dados (Migrations):**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Iniciar o Servidor:**
   ```bash
   npm run dev
   ```

---

## 📖 Documentação da API (Endpoints)

### 🔐 Autenticação (Pública)
| Rota | Método | Descrição |
| :--- | :--- | :--- |
| `/auth/register` | `POST` | Cria um novo usuário |
| `/auth/login` | `POST` | Autentica e retorna o Token JWT |

### 🗂️ Categorias (Protegida)
| Rota | Método | Descrição |
| :--- | :--- | :--- |
| `/categories` | `POST` | Criar categoria |
| `/categories` | `GET` | Listar todas |
| `/categories/:id` | `PUT` | Editar categoria |
| `/categories/:id` | `DELETE` | Excluir categoria |

### 📦 Produtos (Protegida)
| Rota | Método | Descrição |
| :--- | :--- | :--- |
| `/products` | `POST` | Criar produto |
| `/products` | `GET` | Listar todos |
| `/products/:id` | `GET` | Buscar por ID |
| `/products/:id` | `PUT` | Editar produto |
| `/products/:id` | `DELETE` | Excluir produto |

### 📊 Estoque (Protegida)
| Rota | Método | Descrição |
| :--- | :--- | :--- |
| `/stock/in` | `POST` | Registrar entrada de itens |
| `/stock/out` | `POST` | Registrar saída de itens |
| `/stock/movements` | `GET` | Ver histórico completo |

---

## 🏗️ Arquitetura do Projeto
O projeto segue uma arquitetura modular focada em escalabilidade e separação de preocupações (Separation of Concerns):
- **Controllers:** Lidam com requisições HTTP e respostas.
- **Services:** Camada de lógica de negócio pura e interação com o banco.
- **Routes:** Definição dos caminhos da API e middlewares.
- **Middleware:** Validação de Token JWT.
- **Shared:** Código reutilizável (conexão Prisma e middlewares globais).

---

*Dashy_ - Feito com uma coquinha e muito Código.*
