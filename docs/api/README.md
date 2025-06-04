# API Documentation

Task Master exposes a simple REST API used by the dashboard and MCP clients. An OpenAPI specification is provided in this folder and can be explored interactively using [ReDoc](explorer.html).

## OpenAPI

The full specification is available at [openapi.yaml](openapi.yaml). Open it in a tool such as ReDoc or Swagger UI to browse all operations and schemas.

## Usage Guidelines

- The server listens on `http://localhost:3000` by default.
- All endpoints are prefixed with `/api`.
- Request bodies should be sent as JSON with the `Content-Type: application/json` header.
- Most write operations return the updated resource or a status object. Errors are returned in the form `{ "error": "message" }`.

## Endpoints

Below is a quick reference of the most commonly used endpoints. Refer to the OpenAPI file for complete details.

### Tasks

- `GET /api/tasks` – list tasks
- `POST /api/tasks` – create a new task
- `PUT /api/tasks/{id}` – update a task
- `DELETE /api/tasks/{id}` – remove a task

Example request to create a task:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Research API","description":"Read docs"}'
```

### Agents

- `GET /api/agents` – list agents
- `POST /api/agents` – create an agent
- `PUT /api/agents/{id}` – update an agent
- `GET /api/agents/metrics` – agent performance metrics
- `GET /api/agents/history` – assignment history

### PRD

- `GET /api/prd` – fetch the PRD text
- `POST /api/prd` – replace the PRD text
- `POST /api/generate-tasks` – parse the PRD and create tasks

### Sprints

- `GET /api/sprints` – list sprints
- `POST /api/sprints` – create a sprint
- `PUT /api/sprints/{id}` – update a sprint
- `POST /api/sprints/{id}/plan` – auto-plan sprint tasks
- `GET /api/sprints/metrics` – sprint statistics

### CLI & MCP

- `POST /api/cli` – run a Task Master CLI command
- `GET /api/cli/history` – previous CLI runs
- `POST /api/mcp/command` – invoke a Task Master MCP command

### Status & Metrics

- `GET /api/status` – overall task counts
- `GET /api/metrics` – task completion metrics
- `GET /api/velocity` – tasks completed per day
- `GET /api/burndown` – burndown data
- `GET /api/progress` – completion rate
- `GET /api/team-performance` – stats grouped by agent
- `GET /api/trends` – task creation/completion trends
- `GET /api/health` – health check
- `GET /api/ready` – readiness probe

## Response Example

A successful call to `GET /api/tasks` returns:

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Task title",
      "description": "Task description",
      "status": "pending"
    }
  ]
}
```

For full schema definitions and additional endpoints see [openapi.yaml](openapi.yaml).
