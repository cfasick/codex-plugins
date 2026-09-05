# Plugin documentation

This page documents the plugins distributed by the `cfasick-plugins` Codex marketplace.

## API Vault

`api-vault` researches an API provider's current official documentation before proposing configuration. It identifies authentication format, required and optional credential fields, permissions and scopes, sandbox/production endpoints, rotation guidance, documented product areas, and provider-side IP allowlisting.

It also supports OAuth, PostgreSQL and other databases, MCP servers, Python scripts, SSH/private-key connections, webhooks, and custom services. In web projects it can build or update an authenticated Connections/settings page with an API-first connection-type selector and dynamic masked inputs.

Secret values must be entered only through the local masked helper or a protected server-side handler. They must never be pasted into chat, passed in command arguments, stored in browser storage, emitted to logs, or embedded in frontend source. Local development may use a root `.env`; production deployments should use the platform's server-side secret manager.

Example invocation:

```text
Use $api-vault to research Kraken's official authentication requirements and configure this project.
```

Do not include the actual credential in that prompt.

## Crypto Base Scanner

`crypto-base-scanner` is a read-only local MCP integration for Altrady's Crypto Base Scanner API. It supports recent broken bases, market lists, and quick scans. The upstream API documentation is available at [Crypto Base Scanner API](https://cryptobasescanner.docs.apiary.io/).

Required environment variable:

```text
CRYPTO_BASE_SCANNER_API_KEY
```

Optional authentication mode variable:

```text
CRYPTO_BASE_SCANNER_AUTH_MODE
```

Configure values outside the repository. The `.mcp.json` manifest names these variables but does not contain their values.

## Installing from a clone

From a trusted local clone:

```powershell
codex plugin marketplace add C:\path\to\codex-plugins
codex plugin add api-vault@cfasick-plugins
```

Start a new Codex task after installation or an update.

## Updating repository versions

When a personal plugin build changes, Codex should ask whether to synchronize that change into this repository. An approved synchronization updates the repository copy, increments the manifest version according to semantic-versioning impact, refreshes this documentation when needed, validates the repository, and then commits/pushes when authorized.
