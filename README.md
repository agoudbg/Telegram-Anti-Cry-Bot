# Telegram-Anti-Cry-Bot

A Telegram bot that warns users when messages contain crying stickers, Unicode emojis, or custom emojis.

The message policy is implemented in TypeScript under `src/serverless/` and compiled for two runtime adapters:

- GrammY with long polling for a traditional VPS.
- Telegram Serverless handlers for Telegram-managed webhook delivery.

## Local development

Requirements: Node.js 18 or newer and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm build:serverless
```

`pnpm build` produces the VPS bundle under `dist/`. `pnpm build:serverless` compiles the Serverless TypeScript source into the JavaScript modules under `tgcloud/` that are uploaded by the Telegram Serverless CLI.

For VPS-style local development, create a `.env` file with the Bot API token:

```dotenv
TOKEN=your_bot_api_token
```

Then run:

```sh
pnpm dev
```

## Deployment

Read [docs/deployment.md](docs/deployment.md) for both deployment targets, the required credentials, and the safe procedure for switching the same bot between them.
