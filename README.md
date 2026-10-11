# order-management

Sistema de gestão de pedidos com API .NET, worker, PostgreSQL e interface React.

Para configurar e iniciar, só é preciso o Docker. .NET e Node rodam dentro dos containers.

## 1. Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução
- Git
- Portas livres: `5173`, `8080`, `8081`, `5050` e `5432`

## 2. Clonar o repositório

```bash
git clone git@github.com:SergeyKrimon3/order-management.git
cd order-management
```

## 3. Configurar as variáveis

Copie o exemplo e, se quiser, troque usuário, senha ou portas. Esses valores ficam fora do código.

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
copy .env.example .env
```

Se pular este passo, o `docker compose` usa os mesmos padrões do `.env.example`:

| Variável | Padrão | Uso |
| --- | --- | --- |
| `POSTGRES_USER` | `postgres` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | `postgres` | Senha do PostgreSQL |
| `POSTGRES_DB` | `orders` | Nome do banco |
| `POSTGRES_PORT` | `5432` | Porta do banco na sua máquina |
| `PGADMIN_DEFAULT_EMAIL` | `admin@local.dev` | Login do pgAdmin |
| `PGADMIN_DEFAULT_PASSWORD` | `admin` | Senha do pgAdmin |
| `PGADMIN_PORT` | `5050` | Porta do pgAdmin |
| `API_PORT` | `8080` | Porta da API |
| `WORKER_PORT` | `8081` | Porta do healthcheck do worker |
| `FRONTEND_PORT` | `5173` | Porta do frontend |

`ConnectionStrings__Orders` no `.env` serve para rodar a API direto na máquina, com host `localhost`. Dentro do Docker a API usa o host `postgres`, definido pelo Compose.

## 4. Iniciar o projeto

Na raiz do repositório:

```bash
docker compose up --build -d
```

Esse é o único comando de subida. Na primeira vez ele baixa as imagens, compila API, worker e frontend, sobe os cinco serviços e a API aplica as migrations. Espere até os containers ficarem saudáveis.

## 5. Conferir se subiu

```bash
docker compose ps
```

Os cinco serviços precisam estar `healthy`: `postgres`, `api`, `worker`, `frontend` e `pgadmin`.

| Serviço | Endereço |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8080/health |
| Worker | http://localhost:8081/health |
| pgAdmin | http://localhost:5050 |
| PostgreSQL | `localhost:5432` |

`/health` responde `Healthy` quando o processo e a dependência conferida estão no ar. A API também testa o PostgreSQL.

## 6. Abrir o banco

A tabela `orders` fica em `orders` → `Schemas` → `public` → `Tables`. As colunas são `id`, `customer`, `product`, `amount`, `status` e `created_at`.

No pgAdmin:

1. Abra http://localhost:5050
2. Entre com `admin@local.dev` e senha `admin`
3. Cadastre o servidor com host `postgres`, porta `5432`, banco `orders`, usuário `postgres` e senha `postgres`

No DBeaver, na sua máquina:

| Campo | Valor |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| Database | `orders` |
| Username | `postgres` |
| Password | `postgres` |

Se o DBeaver pedir SSL, desative. Este Postgres local não usa certificado.

## 7. Encerrar

```bash
docker compose down
```

O volume do banco é mantido. Para apagar os dados também: `docker compose down -v`.

## Decisões técnicas

| Escolha | Motivo |
| --- | --- |
| .NET 10 | API e worker na linha atual do SDK, publicados nas imagens Docker. |
| EF Core + Npgsql | Migrations versionadas no código e acesso tipado ao PostgreSQL. A API aplica as migrations ao iniciar. |
| RabbitMQ | Fila durável para a mensagem `OrderCreated`, com `CorrelationId` e `EventType`. Entra no mesmo Compose na próxima etapa. |
| React + Vite | A tela é um CRUD. Não há renderização no servidor. |
| Docker Compose | Sobe API, worker, frontend, PostgreSQL e pgAdmin com um comando. Segredos ficam em variáveis de ambiente. |
| pgAdmin | Administração do banco dentro do Compose. O DBeaver continua disponível na máquina local. |

## Estrutura

```
src/OrderManagement.Domain            Entidade, status e contrato da mensagem
src/OrderManagement.Infrastructure    PostgreSQL e health checks
src/OrderManagement.Api               POST /orders, GET /orders, GET /orders/{id}
src/OrderManagement.Worker            Consome OrderCreated e atualiza o status
frontend                              Interface React
tests/OrderManagement.Tests           Testes da regra de status e da idempotência
```

A API e o worker dependem de Infrastructure, que depende só de Domain. A regra de status (`Pendente` → `Processando` → `Finalizado`) fica testável sem subir o PostgreSQL.

## Próximas etapas

1. Endpoints `POST /orders`, `GET /orders` e `GET /orders/{id}`.
2. RabbitMQ e worker idempotente, no mesmo Compose.
3. Telas de listagem, criação e detalhe do pedido.
