# order-management

Sistema de gestão de pedidos com API .NET, processamento assíncrono e interface React.

## Decisões técnicas

| Escolha | Motivo |
| --- | --- |
| .NET 10 | SDK instalado na máquina (`10.0.401`) e suporte de longo prazo da linha atual. |
| EF Core + Npgsql | Migrations versionadas no código e acesso tipado ao PostgreSQL, exigido pelo desafio. |
| RabbitMQ | Fila durável, interface de administração e health check. A mensagem carrega `CorrelationId` e `EventType`. |
| React + Vite | A tela é um CRUD. Não há necessidade de renderização no servidor, então o Vite sobe mais rápido que o Next.js. |
| Docker Compose | Sobe API, worker, frontend, PostgreSQL e pgAdmin com um comando. Segredos ficam em variáveis de ambiente. |

## Estrutura

```
src/OrderManagement.Domain            Entidade, status e contrato da mensagem
src/OrderManagement.Infrastructure    PostgreSQL, RabbitMQ e health checks
src/OrderManagement.Api               POST /orders, GET /orders, GET /orders/{id}
src/OrderManagement.Worker            Consome OrderCreated e atualiza o status
tests/OrderManagement.Tests           Testes da regra de status e da idempotência
```

A API e o worker não acessam o banco nem a fila direto. Os dois dependem de Infrastructure, que depende só de Domain. Assim a regra de status (`Pendente` → `Processando` → `Finalizado`) fica testável sem subir PostgreSQL ou RabbitMQ.

## Banco local

O PostgreSQL sobe no Docker. A API, na sua máquina, e o DBeaver usam a mesma connection string do arquivo `.env`.

```powershell
copy .env.example .env
docker compose up -d
```

DBeaver, conexão PostgreSQL:

| Campo | Valor |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| Database | `orders` |
| Username | `postgres` |
| Password | `postgres` |

Se o teste de conexão pedir SSL, desative. Este Postgres local não usa certificado.

A API aplica as migrations ao iniciar. A tabela `orders` fica no schema `public`, com as colunas `id`, `customer`, `product`, `amount`, `status` e `created_at`.

## Próximas etapas

1. Endpoints `POST /orders`, `GET /orders` e `GET /orders/{id}`.
2. RabbitMQ e worker idempotente.
3. Frontend.
4. API, worker e frontend no mesmo `docker compose up`.
