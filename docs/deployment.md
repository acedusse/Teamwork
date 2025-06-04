# Docker Deployment

This guide explains how to run Task Master in a Docker container.

## Building the Image

Run the following command from the project root:

```bash
docker build -t task-master .
```

## Using Docker Compose

A `docker-compose.yml` file is provided to simplify running the container. It
mounts the `.taskmaster` directory so your tasks persist on the host machine.

```bash
docker-compose up
```

The application will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env` file based on `.env.example` and set your API keys. Important
variables include:

- `ANTHROPIC_API_KEY` – API key for the main model
- `PORT` – Port the server listens on (default: `3000`)
- `CORS_ORIGIN` – Allowed CORS origin
- `LOG_LEVEL` – Logging level (`info`, `debug`, etc.)
- `NODE_ENV` – Node environment (`production` recommended)

Docker Compose automatically loads this file when starting the container.
