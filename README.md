# API de Relatórios de Obra

API para gerenciamento de relatórios de obra, com suporte a múltiplos provedores (Vate e Argelor). A API implementa um sistema de fallback que tenta diferentes provedores em caso de falha, garantindo alta disponibilidade.

## Índice

- [Arquitetura](#arquitetura)
  - [Provedores](#provedores)
  - [Sistema de Fallback](#sistema-de-fallback)
  - [Serviço de Mapeamento](#serviço-de-mapeamento)
- [Requisitos](#requisitos)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Testes](#testes)
  - [Estrutura](#estrutura-1)
  - [Executando Testes](#executando-testes)
- [Monitoramento e Logs](#monitoramento-e-logs)
  - [Sistema de Logs](#sistema-de-logs)
  - [Monitoramento](#monitoramento)
- [Segurança](#segurança)
  - [Validação de Dados](#validação-de-dados)
  - [Tratamento de Erros](#tratamento-de-erros)
- [Endpoints](#endpoints)
  - [Tipos de Dados](#tipos-de-dados)
    - [POST /reports](#post-reports-criar-relatório)
    - [PUT /reports/:id](#put-reportsid-atualizar-relatório)
    - [GET /reports/:id](#get-reportsid-buscar-relatório)
  - [Códigos de Erro](#códigos-de-erro)
- [Considerações finais](#considerações-finais)
  - [O que eu mudaria se fosse para produção](#o-que-eu-mudaria-se-fosse-para-produção)

## Arquitetura

A API segue uma arquitetura em camadas com os seguintes componentes principais:

### Provedores

- Implementação do padrão Provider para abstrair diferentes serviços
- Cada provedor (Vate, Arcelor) implementa a interface `IReportProvider`
- Os provedores são responsáveis por transformar os dados para o formato específico de cada serviço

### Sistema de Fallback

- Em caso de falha em um provedor, a API tenta automaticamente o próximo
- O sistema mantém logs detalhados de cada tentativa
- Após todas as tentativas falharem, retorna erro 503 (Service Unavailable)

### Serviço de Mapeamento

- Mantém a consistência dos IDs entre a API e os provedores
- Permite rastrear qual provedor está armazenando cada relatório
- Facilita a migração de dados entre provedores

## Requisitos

- Node.js 18+
- Docker e Docker Compose
- npm 9+

## Configuração do Ambiente

A API utiliza dois serviços mock para simular os provedores:

- Vate Mock: http://localhost:3001
- Argelor Mock: http://localhost:3002

A API principal roda em: http://localhost:3000

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/oppem.git
cd oppem
```

2. Inicie os serviços:

```bash
docker-compose build
docker-compose up
```

## Estrutura do Projeto

```
.
├── src/
│   ├── api/           # Rotas e middleware da API
│   │   ├── routes/    # Definição das rotas
│   │   └── middleware/# Middlewares (validação)
│   ├── core/          # Lógica de negócio
│   │   ├── report.service.ts    # Serviço principal
│   │   └── mapping.service.ts   # Gerenciamento de IDs
│   ├── providers/     # Implementações dos provedores
│   │   ├── base.provider.ts     # Interface base
│   │   ├── vate.provider.ts     # Provedor Vate
│   │   └── argelor.provider.ts  # Provedor Argelor
│   ├── types/         # Definições de tipos
│   └── utils/         # Utilitários (logger, erros)
├── mocks/             # Serviços mock
└── docker-compose.yml # Configuração Docker
```

## Testes

### Estrutura

Teste unitários e de integração são encontrados junto ao arquivo testado, com o sufixo `.test`

### Executando Testes

```bash
# Executar todos os testes
docker-compose run --rm test npm test

# Executar testes específicos
docker-compose run --rm test npm test report.service

# Executar testes com cobertura
docker-compose run --rm test npm run test:coverage

# Executar testes em modo watch
docker-compose run --rm test npm run test:watch
```

## Monitoramento e Logs

### Sistema de Logs

- Utilizada a lib Winston para logging
- Logs são escritos em `logs/combined.log`
- Níveis: error, warn, info, debug, verbose

### Monitoramento

- Logs incluem contexto e stack traces
- Erros são categorizados (validation, not found, etc.)
- Métricas de performance são registradas

## Segurança

### Validação de Dados

- Todos os inputs são validados usando Zod
- Validações incluem tipos, formatos e regras de negócio
- Erros de validação retornam 400 com detalhes

### Tratamento de Erros

- Erros são categorizados e logados
- Respostas de erro não expõem detalhes sensíveis

## Endpoints

Há uma collection do postman (v2.1) na raiz do projeto para facilitar o entendimento e o test dos endpoints.

### Tipos de Dados

#### POST /reports (Criar Relatório)

**Entrada**
| Campo | Tipo | Descrição | Exemplo |
| ------------- | -------- | --------------------------------------------- | ------------------------------------------------- |
| `id` | string | ID da obra (mín. 3 caracteres) | "OBRA-123" |
| `date` | string | Data no formato YYYY-MM-DD | "2024-03-20" |
| `weather` | enum | Condição climática | "ensolarado", "chuvoso", "nublado", "tempestuoso" |
| `description` | string | Descrição das atividades (mín. 10 caracteres) | "Relatório de atividades do dia..." |
| `workers` | string[] | Lista de trabalhadores (mín. 3 caracteres) | ["João Silva", "Maria Santos"] |

**Saída (201 Created)**
| Campo | Tipo | Descrição | Exemplo |
| ---------- | ------ | ---------------------------------- | -------------------------------------- |
| `id` | string | ID único do relatório (UUID) | "550e8400-e29b-41d4-a716-446655440000" |
| `status` | enum | Status da operação | "created" |
| `provider` | enum | Provedor que processou a operação | "VATE", "ARGELOR" |

**Exemplo**

```bash
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "id": "OBRA-123",
    "date": "2024-03-20",
    "weather": "ensolarado",
    "description": "Relatório de atividades do dia com mais de 10 caracteres",
    "workers": ["João Silva", "Maria Santos"]
  }'
```

**Erros de Validação (400 Bad Request)**
| Campo | Regra | Mensagem de Erro |
|-------|-------|------------------|
| `id` | Deve ter no mínimo 3 caracteres | "ID do relatório inválido" |
| `date` | Deve ser uma data válida no formato YYYY-MM-DD | "Data inválida" |
| `weather` | Deve ser um dos valores: "ensolarado", "chuvoso", "nublado", "tempestuoso" | "Condição climática deve ser: ensolarado, chuvoso, nublado ou tempestuoso" |
| `description` | Deve ter no mínimo 10 caracteres | "Descrição deve conter no mínimo 10 caracteres" |
| `workers` | Array não vazio, cada item com mínimo de 3 caracteres | "Equipe deve conter no mínimo 1 trabalhador" e "Trabalhador deve conter no mínimo 3 caracteres" |

**Exemplo de Erro**

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "path": "body.id",
      "message": "ID do relatório inválido"
    },
    {
      "path": "body.weather",
      "message": "Condição climática deve ser: ensolarado, chuvoso, nublado ou tempestuoso"
    },
    {
      "path": "body.description",
      "message": "Descrição deve conter no mínimo 10 caracteres"
    },
    {
      "path": "body.workers",
      "message": "Equipe deve conter no mínimo 1 trabalhador"
    }
  ]
}
```

#### PUT /reports/:id (Atualizar Relatório)

**Entrada**
| Campo | Tipo | Descrição | Exemplo |
| ------------- | -------- | --------------------------------------------- | ------------------------------------------------- |
| `obraId` | string | ID da obra (mín. 3 caracteres) | "OBRA-456" |
| `date` | string | Data no formato YYYY-MM-DD | "2024-03-20" |
| `weather` | enum | Condição climática | "ensolarado", "chuvoso", "nublado", "tempestuoso" |
| `description` | string | Descrição das atividades (mín. 10 caracteres) | "Atualização do relatório..." |
| `workers` | string[] | Lista de trabalhadores (mín. 3 caracteres) | ["João Silva", "Maria Santos"] |

**Saída (200 OK)**
| Campo | Tipo | Descrição | Exemplo |
| ---------- | ------ | ---------------------------------- | -------------------------------------- |
| `id` | string | ID único do relatório (UUID) | "550e8400-e29b-41d4-a716-446655440000" |
| `status` | enum | Status da operação | "updated" |
| `message` | string | Mensagem descritiva | "Relatório atualizado com sucesso" |

**Exemplo**

```bash
curl -X PUT http://localhost:3000/reports/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "obraId": "OBRA-456",
    "date": "2024-03-20",
    "weather": "chuvoso",
    "description": "Atualização do relatório com mais de 10 caracteres",
    "workers": ["João Silva", "Maria Santos"]
  }'
```

**Erros de Validação (400 Bad Request)**
| Campo | Regra | Mensagem de Erro |
|-------|-------|------------------|
| `id` (param) | Deve ser um UUID válido | "ID inválido" |
| `id` | Deve ter no mínimo 3 caracteres | "ID do relatório inválido" |
| `date` | Deve ser uma data válida no formato YYYY-MM-DD | "Data inválida" |
| `weather` | Deve ser um dos valores: "ensolarado", "chuvoso", "nublado", "tempestuoso" | "Condição climática deve ser: ensolarado, chuvoso, nublado ou tempestuoso" |
| `description` | Deve ter no mínimo 10 caracteres | "Descrição deve conter no mínimo 10 caracteres" |
| `workers` | Array não vazio, cada item com mínimo de 3 caracteres | "Equipe deve conter no mínimo 1 trabalhador" e "Trabalhador deve conter no mínimo 3 caracteres" |

**Exemplo de Erro**

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "path": "params.id",
      "message": "ID inválido"
    },
    {
      "path": "body.description",
      "message": "Descrição deve conter no mínimo 10 caracteres"
    },
    {
      "path": "body.workers",
      "message": "Equipe deve conter no mínimo 1 trabalhador"
    }
  ]
}
```

#### GET /reports/:id (Buscar Relatório)

**Entrada**
| Campo | Tipo | Descrição | Exemplo |
| ----- | ------ | ------------------------ | -------------------------------------- |
| `id` | string | ID do relatório (UUID) | "550e8400-e29b-41d4-a716-446655440000" |

**Saída (200 OK)**
| Campo | Tipo | Descrição | Exemplo |
| ------------- | -------- | --------------------------------------------- | ------------------------------------------------- |
| `id` | string | ID único do relatório (UUID) | "550e8400-e29b-41d4-a716-446655440000" |
| `provider_id` | string | ID do relatório no provedor (UUID) | a773bece-e7c0-4dfa-b64b-994bbb233648|
| `report_id` | string | ID da obra | "OBRA-123" |
| `date` | string | Data no formato YYYY-MM-DD | "2024-03-20" |
| `weather` | enum | Condição climática | "ensolarado", "chuvoso", "nublado", "tempestuoso" |
| `description` | string | Descrição das atividades | "Relatório de atividades do dia..." |
| `workers` | string[] | Lista de trabalhadores | ["João Silva", "Maria Santos"] |

**Exemplo**

```bash
curl http://localhost:3000/reports/550e8400-e29b-41d4-a716-446655440000
```

**Erros de Validação (400 Bad Request)**
| Campo | Regra | Mensagem de Erro |
|-------|-------|------------------|
| `id` (param) | Deve ser um UUID válido | "ID inválido" |

**Exemplo de Erro**

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "path": "params.id",
      "message": "ID inválido"
    }
  ]
}
```

### Códigos de Erro

| Código | Descrição             | Quando Ocorre                |
| ------ | --------------------- | ---------------------------- |
| 400    | Bad Request           | Dados inválidos ou faltando  |
| 404    | Not Found             | Relatório não encontrado     |
| 500    | Internal Server Error | Erro inesperado              |
| 503    | Service Unavailable   | Todos os provedores falharam |

## Considerações finais

### O que eu mudaria se fosse para produção

#### Daemon

Desenvolvi utilizando a lib `ts-node` para agilizar o desenvolvimento. Entretanto, em produção ela ainda é um pouco custosa (mesmo com a flag `--transpile-only`). Usaria uma abordagem diferente em PROD (pm2 ou similar).

#### Logs

Criei um sistema de logs simplificado. Seriam necessários mais pontos de log e informações adicionais para que os logs se tornem verdadeiramente úteis.

#### Persistência

Os dados são armazenados em memória (ID retornado pelo provedor, ID gerado pela API e nome do provedor). Seria necessário mover isso para algum banco de dados.

#### Resiliência da aplicação

Dependendo da quantidade de acessos gerando relatórios, a aplicação pode não suportar e cair ou acabar derrubando um provedor. Para evitar falhas nesse sentido, eu adicionaria:

- Um endpoint que recebe o acesso e adiciona a requisição a uma estrutura de fila (Kafka, RabbitMQ, Redis, etc.)
- Um consumer rodando em background para ler da fila e adicionar o relatório ao provedor

Essa estrutura permitiria escalar de forma independente os dois pontos críticos da aplicação, mas ao custo de não termos mais o "tempo real" entre a criação do RDO (`POST`) e a visualização (`GET`).
