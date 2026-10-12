# Gestão de pedidos

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
| `POSTGRES_DB` | `tmb-local` | Nome do banco |
| `POSTGRES_PORT` | `5432` | Porta do banco na sua máquina |
| `PGADMIN_DEFAULT_EMAIL` | `admin@local.dev` | Login do pgAdmin |
| `PGADMIN_DEFAULT_PASSWORD` | `admin` | Senha do pgAdmin |
| `PGADMIN_PORT` | `5050` | Porta do pgAdmin |
| `API_PORT` | `8080` | Porta da API |
| `WORKER_PORT` | `8081` | Porta do healthcheck do worker |
| `FRONTEND_PORT` | `5173` | Porta do frontend |
| `LLM_API_KEY` | vazio | Chave do modelo. Sem ela, o chat não responde |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Endereço de uma API compatível com a OpenAI |
| `LLM_MODEL` | `gpt-4o-mini` | Nome do modelo |

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

As tabelas `orders` e `favorites` ficam em `tmb-local` → `Schemas` → `public` → `Tables`.

No pgAdmin:

1. Abra http://localhost:5050
2. Entre com `admin@local.dev` e senha `admin`
3. Cadastre o servidor com host `postgres`, porta `5432`, banco `tmb-local`, usuário `postgres` e senha `postgres`

No DBeaver, na sua máquina:

| Campo | Valor |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| Database | `tmb-local` |
| Username | `postgres` |
| Password | `postgres` |

Se o DBeaver pedir SSL, desative. Este Postgres local não usa certificado.

## 7. Encerrar

```bash
docker compose down
```

O volume do banco é mantido. Para apagar os dados também: `docker compose down -v`.

## Pergunte a IA

O chat ao lado dos favoritos é o marco opcional do projeto. Não há perguntas prontas nem frases gravadas. A pessoa escreve em linguagem livre e o modelo responde com o que está no banco.

O ícone de IA abre o chat. Enter envia. Enquanto o modelo trabalha, o balão mostra **Pensando** com três bolinhas. Quando a resposta chega, o cursor volta para o campo. Fechar o modal encerra a conversa.

### Modelo em uso

Este ambiente usa o **Ollama Cloud**, com o modelo **`gpt-oss:20b`**.

| Item | Valor |
| --- | --- |
| Provedor | [Ollama Cloud](https://ollama.com) |
| API | `https://ollama.com/v1`, no formato de chat da OpenAI |
| Modelo | `gpt-oss:20b` |
| Autenticação | `Bearer`, com uma chave criada em [ollama.com/settings/keys](https://ollama.com/settings/keys) |
| Temperatura | `0`, para a resposta seguir os dados |
| Espera máxima | 60 segundos na API |

A chave fica só no `.env`, na variável `LLM_API_KEY`. Esse arquivo não entra no Git. Para o Ollama Cloud, a chamada manda `think: false`, então a resposta vem direto, sem o raciocínio interno do modelo.

O código aceita qualquer API compatível com a OpenAI. Trocar de modelo é mudar três variáveis e recriar o container da API:

```env
LLM_API_KEY=sua-chave
LLM_BASE_URL=https://ollama.com/v1
LLM_MODEL=gpt-oss:20b
```

```bash
docker compose up -d --force-recreate --no-deps api
```

Um Ollama local usa, por exemplo, `LLM_BASE_URL=http://host.docker.internal:11434/v1`. A OpenAI usa `https://api.openai.com/v1` e o nome do modelo desejado. Com essa URL da OpenAI e sem `LLM_API_KEY`, `POST /orders/ask` responde `503`.

O Compose entrega essas variáveis só para a API, como `Llm__BaseUrl`, `Llm__ApiKey` e `Llm__Model`. O worker não chama o modelo.

### O que o modelo recebe

A cada pergunta a API lê o PostgreSQL e monta o contexto. O modelo não escreve SQL e não enxerga a senha do banco.

- **Pedidos** (`orders`): cliente, produto, valor em reais, status, criação, atualização e, quando houver, o pedido de origem de um "pedir novamente".
- **Favoritos** (`favorites`): o id do pedido favoritado e a data em que foi marcado. O modelo cruza esse id com o pedido.
- **Relógio** de Brasília (`America/Sao_Paulo`), para perguntas como "hoje" ou "neste mês".
- **Histórico** da conversa aberta, até as últimas 20 falas. "Quais são eles?" continua valendo se a frase anterior foi sobre favoritos. Fechar o modal apaga essa memória.

Se a resposta não estiver nesses dados, o modelo diz que não sabe. Ele não inventa pedido, favorito, produto, cliente, valor nem data. A resposta sai no idioma da pergunta, em uma ou duas frases, sem markdown.

O endpoint é `POST /orders/ask`. O corpo leva `question` (de 1 a 1000 caracteres), `locale` e `history`. O frontend chama isso em `/api/orders/ask`. O nginx espera até 90 segundos por essa resposta.

## Mensageria transacional

Criar um pedido, ou mudar o status dele, grava a linha de negócio e a mensagem na mesma transação do PostgreSQL. A mensagem fica em `outbox_messages`, com `published_at` vazio. O RabbitMQ não entra nessa transação.

Um relay na API e outro no worker leem as mensagens ainda não publicadas com `FOR UPDATE SKIP LOCKED`, publicam na fila e só então preenchem `published_at`. Se o RabbitMQ estiver fora, o pedido continua salvo e a mensagem espera. As duas instâncias do relay não publicam a mesma linha ao mesmo tempo. Se o processo cair depois de publicar e antes de marcar, a mensagem sai de novo: o worker ignora um pedido que já está finalizado.

`OrderCreated` vai para a fila `order-created`. `OrderStatusChanged` vai para `order-status-changed`.

## Histórico de status

Cada pedido guarda a trilha dos status em `order_status_history`: pendente na criação, depois processando e finalizado. A linha entra na mesma transação da mudança, junto com a mensagem do outbox. A página do pedido mostra essa trilha, com a data e a hora de cada passo.

Pedidos que já existiam antes desta tabela recebem o que dá para reconstruir: pendente na data de criação e, se o status atual for outro, esse status na data de atualização. O instante do "processando" desses pedidos antigos não foi guardado.

O detalhe `GET /orders/{id}` devolve a lista em `history`. A listagem não traz essa lista.

## Status ao vivo

A lista e a página do pedido escutam `GET /orders/events`. Cada mudança de status chega por esse stream e a tela busca o pedido de novo. A API manda um ping a cada 15 segundos para a conexão não morrer em silêncio.

Se o stream cair, a tela passa a consultar o pedido a cada 3 segundos: a lista chama `GET /orders` e a página do pedido chama `GET /orders/{id}`. Quando a conexão volta, essa consulta para e o stream segue como canal principal.

## Decisões técnicas

| Escolha | Motivo |
| --- | --- |
| .NET 10 | API e worker na linha atual do SDK, publicados nas imagens Docker. |
| EF Core + Npgsql | Migrations versionadas no código e acesso tipado ao PostgreSQL. A API aplica as migrations ao iniciar. |
| RabbitMQ | Fila durável para `OrderCreated` e `OrderStatusChanged`, com `CorrelationId` e `EventType`. |
| Outbox | A mensagem nasce na mesma transação do pedido. O relay publica no RabbitMQ depois. |
| Histórico de status | Cada transição fica em `order_status_history`, na mesma transação do status. |
| Status ao vivo | O frontend escuta o stream de eventos. Se ele cair, consulta o pedido a cada 3 segundos até a conexão voltar. |
| React + Vite | A tela é um CRUD. Não há renderização no servidor. |
| Docker Compose | Sobe API, worker, frontend, PostgreSQL e pgAdmin com um comando. Segredos ficam em variáveis de ambiente. |
| pgAdmin | Administração do banco dentro do Compose. O DBeaver continua disponível na máquina local. |
| Ollama Cloud `gpt-oss:20b` | Chat opcional. O modelo recebe pedidos, favoritos e a conversa aberta, e escreve a resposta. Não há perguntas nem frases prontas. |

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
