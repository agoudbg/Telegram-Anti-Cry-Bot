# Deployment

This project supports two deployment targets from the same repository:

- a traditional VPS running the Node.js process with GrammY long polling;
- Telegram Serverless running the handler under `tgcloud/`.

The message policy source is shared by both targets in `src/serverless/lib/message-inspector.ts`. The runtime adapters are intentionally separate because the two platforms expose different update and Bot API interfaces. `pnpm build` includes the source in the VPS bundle, while `pnpm build:serverless` compiles the Serverless source into the JavaScript files under `tgcloud/`.

## Common requirements

- Node.js 18 or newer.
- A bot created with `@BotFather`.
- A working copy of this repository.

Run the checks before either deployment:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm build:serverless
```

The test command runs the TypeScript tests through `tsx`. The VPS build type-checks the polling entry point and shared policy. The Serverless build type-checks `src/serverless/` and emits the JavaScript deployment files under `tgcloud/`.

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

Telegram Serverless runs the generated JavaScript files under `tgcloud/`. The TypeScript source is under `src/serverless/`; the handler source is `src/serverless/handlers/message.ts`, and the shared message policy source is `src/serverless/lib/message-inspector.ts`.

Install the CLI once on each machine that deploys this repository:

```sh
npm install --global @tgcloud/cli@0.2.0
tgcloud --version
```

### Build the Serverless source

Compile the TypeScript source before inspecting or deploying the Serverless project:

```sh
pnpm build:serverless
```

This writes `tgcloud/handlers/message.js` and `tgcloud/lib/message-inspector.js`. These generated JavaScript files are the deployment input for `tgcloud push`; edit the TypeScript files under `src/serverless/` and regenerate them instead of editing the generated files manually. The `sdk` declaration in `src/serverless/sdk.d.ts` is used only by TypeScript and is not deployed.

Serverless does not use the `.env` `TOKEN` value. Bot API access is provided by the linked Telegram Serverless project, so the CLI access token and the Bot API token are separate credentials.

### Enable Serverless for the bot

In `@BotFather`:

1. Open the bot.
2. Open `Serverless`.
3. Enable Serverless and copy the CLI access token from `CLI Access`.

The CLI access token is used for deployment. Treat it as a secret and do not commit the `.tgcloud/` directory.

### Link a checkout to the bot

This repository already contains `tgcloud.jsonc`, `tgcloud/schema.js`, and the generated handler modules. A clean checkout does not need `tgcloud init`; that command only scaffolds a new or incomplete local project. The project creator is not part of the deployment flow for this repository.

Link the checkout with the CLI access token from BotFather:

```sh
tgcloud login
tgcloud status
```

The CLI stores local credentials under `.tgcloud/`, which is ignored by this repository.

### Test and deploy the handler

Run the repository checks first:

```sh
pnpm test
pnpm build
pnpm build:serverless
```

To execute the handler against local project files without publishing them, use a message that does not trigger a reply:

```sh
tgcloud run handlers/message '{ chat: { id: 1 }, message_id: 1, text: "hello" }'
```

The normal deployment command builds the TypeScript source and pushes the generated JavaScript:

```sh
pnpm run deploy
tgcloud webhook
```

`pnpm run deploy` runs the Serverless build script and then calls `tgcloud push`. Run `tgcloud webhook` after the deployment to inspect the active webhook. If it reports a mismatch, run `tgcloud webhook sync` and check the status again.

### GitHub Actions deployment

The repository includes `.github/workflows/deploy-serverless.yml`. It runs the tests, the VPS type-check build, and the Serverless TypeScript build for every push to `main` and for manual workflow dispatches. It publishes to Telegram Serverless only when the `TGCLOUD_TOKEN` Actions secret is configured.

Create a repository secret named `TGCLOUD_TOKEN` with the CLI access token from BotFather (`your bot` -> `Serverless` -> `CLI Access` -> `Access token`). The workflow passes this secret only to `tgcloud fetch` and `tgcloud push`; it does not run the interactive `tgcloud login` command. When the secret is missing, validation still runs and the deployment steps report that publication was skipped.

Each Actions run starts from a clean checkout, so the workflow runs `tgcloud fetch` before `tgcloud push`. This refreshes the local `.tgcloud/` snapshot without changing the checked-out files and lets `push` perform its remote revision check. The workflow never uses `--force`.

This workflow deploys the Telegram Serverless target only. It does not start, stop, or update the VPS service. Keep the same bot on one update receiver at a time: stop the VPS long-polling process before switching the bot to the Serverless webhook, following the switching procedure above.

### Serverless runtime constraints

Only generated JavaScript modules under `tgcloud/schema.js`, `tgcloud/lib/`, `tgcloud/handlers/`, and `tgcloud/endpoints/` are deployed as backend code. Keep the TypeScript source under `src/serverless/` independent of `grammy`, `dotenv`, `process.env`, the local filesystem, and arbitrary npm packages so the generated Serverless bundle remains portable.

The platform provides the Telegram Bot API through `sdk`, persistent SQLite through `sdk/db`, and outbound HTTP through `sdk/fetch`. Do not keep important state in module-level variables because a later invocation can run in a different isolate.

This bot is currently stateless, so it does not need a database migration. If persistent state is added later, design a storage adapter for both targets and run Serverless schema migrations separately from code deployment.

## Switching the same bot between targets

The same bot token must have exactly one active update receiver at a time.

### VPS to Telegram Serverless

1. Stop the VPS process so it no longer polls for updates.
2. Run `pnpm run deploy` to regenerate and push the current `tgcloud/` modules.
3. Verify the webhook status with `tgcloud webhook`.
4. If the status reports a mismatch, run `tgcloud webhook sync` and verify it again.

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
