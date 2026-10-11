# order-management

Sistema de gestão de pedidos com API .NET, processamento assíncrono e interface React.

## Subir o ambiente

Na raiz do repositório, com o Docker em execução:

```bash
docker compose up --build -d
```

Esse é o único comando. Em outra máquina, clone o repositório e rode essa linha. O Compose sobe a API, o worker, o frontend, o PostgreSQL e o pgAdmin. A API aplica as migrations ao iniciar. Cada serviço só fica saudável depois do healthcheck.

Sem um arquivo `.env`, valem os padrões de desenvolvimento. Para trocar usuário, senha ou portas, copie `.env.example` para `.env` e edite antes do comando. Esses valores não ficam no código.

| Serviço | Endereço |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8080/health |
| Worker | http://localhost:8081/health |
| pgAdmin | http://localhost:5050 |
| PostgreSQL | `localhost:5432` |

pgAdmin: e-mail `admin@local.dev`, senha `admin`. No servidor, use o host `postgres`, banco `orders`, usuário `postgres` e senha `postgres`.

DBeaver, na sua máquina, usa o mesmo PostgreSQL: host `localhost`, porta `5432`, database `orders`, usuário `postgres`, senha `postgres`. Se pedir SSL, desative.

Para encerrar:

```bash
docker compose down
```

## Decisões técnicas

| Escolha | Motivo |
| --- | --- |
| .NET 10 | SDK instalado na máquina (`10.0.401`) e suporte de longo prazo da linha atual. |
| EF Core + Npgsql | Migrations versionadas no código e acesso tipado ao PostgreSQL, exigido pelo desafio. |
| RabbitMQ | Fila durável, interface de administração e health check. A mensagem carrega `CorrelationId` e `EventType`. |
| React + Vite | A tela é um CRUD. Não há necessidade de renderização no servidor, então o Vite sobe mais rápido que o Next.js. |
| Docker Compose | Sobe API, worker, frontend, PostgreSQL e pgAdmin com um comando. Segredos ficam em variáveis de ambiente. |
| pgAdmin | Interface de administração do banco dentro do mesmo Compose. O DBeaver continua disponível na máquina local. |

## Estrutura

```
src/OrderManagement.Domain            Entidade, status e contrato da mensagem
src/OrderManagement.Infrastructure    PostgreSQL e health checks
src/OrderManagement.Api               POST /orders, GET /orders, GET /orders/{id}
src/OrderManagement.Worker            Consome OrderCreated e atualiza o status
frontend                              Interface React
tests/OrderManagement.Tests           Testes da regra de status e da idempotência
```

A API e o worker não acessam o banco direto. Os dois dependem de Infrastructure, que depende só de Domain. Assim a regra de status (`Pendente` → `Processando` → `Finalizado`) fica testável sem subir PostgreSQL.

A tabela `orders` fica no schema `public`, com as colunas `id`, `customer`, `product`, `amount`, `status` e `created_at`.

## Próximas etapas

1. Endpoints `POST /orders`, `GET /orders` e `GET /orders/{id}`.
2. RabbitMQ e worker idempotente, no mesmo Compose.
3. Telas de listagem, criação e detalhe do pedido.
