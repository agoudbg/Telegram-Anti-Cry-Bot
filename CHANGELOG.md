# Changelog

All notable changes to Telegram-Anti-Cry-Bot are documented here.

## [3.0.0] - 2026-10-14

### Added

- Added a Telegram Serverless runtime alongside the traditional VPS long-polling runtime.
- Added a TypeScript source and build pipeline for Serverless handlers, with generated JavaScript modules under `tgcloud/`.
- Added automatic Telegram Serverless deployment through GitHub Actions when the `TGCLOUD_TOKEN` secret is configured.
- Added detection for crying Unicode emojis in message text and captions.
- Added detection for crying custom emojis in Telegram Rich Messages.
- Added detection for crying Unicode emojis in Telegram Rich Messages.

### Changed

- Shared the message inspection policy between the VPS and Serverless adapters.
- Documented the credentials, build commands, deployment workflow, and safe switching procedure for both deployment targets.

### Deployment notes

- The VPS and Telegram Serverless runtimes remain alternative update receivers for one bot token. Do not run VPS long polling while the Serverless webhook is active.
- GitHub Actions always runs tests and both builds. It skips publication when `TGCLOUD_TOKEN` is not configured.
