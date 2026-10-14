# Deployment

This project supports two deployment targets from the same repository:

- a traditional VPS running the Node.js process with GrammY long polling;
- Telegram Serverless running the handler under `tgcloud/`.

The message policy is shared by both targets in `tgcloud/lib/message-inspector.js`. The runtime adapters are intentionally separate because the two platforms expose different update and Bot API interfaces.

## Common requirements

- Node.js 18 or newer.
- A bot created with `@BotFather`.
- A working copy of this repository.

Run the checks before either deployment:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

The test command uses Node's built-in test runner. The build command type-checks the TypeScript entry point and the shared JavaScript module through `checkJs`.

## Traditional VPS

### Configure the bot token

Create `.env` in the repository root and keep it out of version control:

```dotenv
TOKEN=your_bot_api_token
```

The VPS adapter loads this value through `dotenv` and starts GrammY long polling from `index.ts`.

### Run the bot

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The process must stay running. Use the process manager already used by your VPS, such as `systemd`, a supervisor, or a container runtime. A minimal `systemd` unit looks like this after replacing the paths and account name:

```ini
[Unit]
Description=Telegram Anti Cry Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=bot
WorkingDirectory=/opt/telegram-anti-cry-bot
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

The `.env` file must be readable by the service account. Do not put the Bot API token in the unit file or commit it to the repository.

### Update the VPS deployment

Stop the existing process, update the checkout, install the locked dependencies, build, and start the process again:

```sh
git pull --ff-only
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm start
```

If the bot was previously connected to Telegram Serverless, remove the Serverless webhook before starting long polling. Telegram Bot API defines `getUpdates` and webhooks as mutually exclusive update-delivery methods. Use the `deleteWebhook` method through a secret manager or another protected administration path, then start the VPS process.

## Telegram Serverless

Telegram Serverless runs the files under `tgcloud/`. The bot handler is `tgcloud/handlers/message.js`, and the shared message policy is `tgcloud/lib/message-inspector.js`.

Serverless does not use the `.env` `TOKEN` value. Bot API access is provided by the linked Telegram Serverless project, so the CLI access token and the Bot API token are separate credentials.

### Enable Serverless for the bot

In `@BotFather`:

1. Open the bot.
2. Open `Serverless`.
3. Enable Serverless and copy the CLI access token from `CLI Access`.

The CLI access token is used for deployment. Treat it as a secret and do not commit the `.tgcloud/` directory.

### Initialize the project locally

The official project creator can initialize an existing project without overwriting the files already in this repository:

```sh
npm create @tgcloud/bot .
```

If the CLI is already installed in the project, initialize or inspect it with:

```sh
npx tgcloud init
npx tgcloud status
```

Complete the login step with the CLI access token from BotFather:

```sh
npx tgcloud login
```

The CLI stores local credentials under `.tgcloud/`, which is ignored by this repository.

### Test and deploy the handler

Run the repository checks first:

```sh
pnpm test
pnpm build
```

To execute the handler against local project files without publishing them, use a message that does not trigger a reply:

```sh
npx tgcloud run handlers/message '{ chat: { id: 1 }, message_id: 1, text: "hello" }'
```

Deploy the handler and the shared module atomically:

```sh
npx tgcloud status
npx tgcloud push
npx tgcloud webhook sync
```

`webhook sync` points Telegram at the Serverless platform and rebuilds the allowed update list from the deployed handlers. Deploying a new handler can leave the webhook out of sync until this command is run.

### Serverless runtime constraints

Only JavaScript modules under `tgcloud/schema.js`, `tgcloud/lib/`, `tgcloud/handlers/`, and `tgcloud/endpoints/` are deployed as backend code. Keep Serverless code independent of `grammy`, `dotenv`, `process.env`, the local filesystem, and arbitrary npm packages.

The platform provides the Telegram Bot API through `sdk`, persistent SQLite through `sdk/db`, and outbound HTTP through `sdk/fetch`. Do not keep important state in module-level variables because a later invocation can run in a different isolate.

This bot is currently stateless, so it does not need a database migration. If persistent state is added later, design a storage adapter for both targets and run Serverless schema migrations separately from code deployment.

## Switching the same bot between targets

The same bot token must have exactly one active update receiver at a time.

### VPS to Telegram Serverless

1. Stop the VPS process so it no longer polls for updates.
2. Push the current `tgcloud/` modules.
3. Run `npx tgcloud webhook sync`.
4. Verify the webhook status with `npx tgcloud webhook`.

### Telegram Serverless to VPS

1. Stop or disable the Serverless webhook by calling the Bot API `deleteWebhook` method through a protected administration path.
2. Keep pending updates unless you intentionally want to discard them.
3. Confirm that the webhook URL is empty with `getWebhookInfo`.
4. Start the VPS process with `pnpm start`.

Do not run the VPS long-polling process while the Serverless webhook is active. This is a deployment choice, not an active-active arrangement. Use separate bot tokens when both environments must receive updates at the same time.

## Official references

- [Telegram Serverless](https://core.telegram.org/bots/serverless)
- [Telegram Mini Apps Serverless endpoints](https://core.telegram.org/bots/webapps#serverless)
- [Telegram Bot API update delivery](https://core.telegram.org/bots/api)
