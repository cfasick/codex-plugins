---
name: api-vault
description: Research and securely configure APIs and other project connections, including required credentials, root .env entries, IP allowlisting, and a website Connections page. Use for API, OAuth, PostgreSQL/database, MCP, Python-script, SSH/private-key, webhook, or custom connection setup without exposing secrets in chat, browser storage, commands, web requests, or logs.
---

# API Vault

Keep secret values on the user's machine while turning official documentation and project contracts into safe environment configuration and, for web projects, a secure Connections page. API setup is the primary workflow; other supported connection kinds follow the same secret boundary.

## Non-negotiable secret boundary

- Never ask the user to paste an API key, token, database password/URL, secret, passphrase, private key, webhook signing secret, or credential-bearing URL into chat.
- Never include a secret in a web query, browser URL, tool call, command argument, generated profile, patch, log, commentary, or final response.
- Search using only the provider/API name, product name, and nonsecret documentation URLs.
- Collect values only through the bundled helper's local masked prompts. The helper has no network code.
- If a secret was already pasted into chat, treat it as exposed. Do not write or reuse it. Tell the user to revoke/rotate it and enter a replacement only in the local masked prompt.
- Do not test an API by sending a newly entered credential unless the user separately asks for a live test and understands that it will contact the provider.

## Workflow

1. Identify the connection kind and provider from the user's name, project code, or docs URL. Default to `api`; also support `oauth`, `postgresql`/`database`, `mcp`, `python-script`, `ssh`, `webhook`, and `custom`. If the user supplied only a secret, do not inspect or fingerprint it; ask for the provider or connection type.
2. Resolve the intended project root. Prefer the repository root when the request targets the current project. Confirm before writing elsewhere.
3. Inspect existing `.env.example`, `.env.sample`, configuration code, and `.gitignore` for local naming conventions. Never display existing `.env` values.
4. For APIs, OAuth, hosted databases, SDKs, and webhooks, find current official authentication or connection documentation. Prefer provider-owned docs and developer portals. For a local MCP server or Python script, inspect its manifest, help output, imports, and configuration contract without executing untrusted code. Separate documented facts from project-local recommendations.
5. For API-like connections, build a complete authentication profile:
   - every required and optional credential component, such as API key/token, API secret, passphrase, private-key path, client ID/secret, account or organization ID, tenant, region, sandbox flag, and webhook signing secret;
   - exact header, bearer, query, OAuth, or request-signing format;
   - permissions/scopes and least-privilege advice;
   - production versus sandbox endpoints;
   - documented product areas/use cases, summarized by capability rather than claiming every endpoint has been enumerated;
   - key rotation/revocation guidance;
   - whether provider-side IP allowlisting exists, its accepted IPv4/IPv6/CIDR format, and the official settings page.
6. Choose environment variable names. Use names explicitly shown by official docs or the project first. When neither defines names, use uppercase `<PROVIDER>_<FIELD>` names and clearly label them as a local convention, not a provider requirement.
7. Show the user the proposed nonsecret rows before secret entry: variable name, purpose, required/optional status, input type, and documentation source. Ask only about choices that materially affect the schema, such as sandbox versus production or OAuth versus static keys.
8. Ask whether to enable IP allowlisting when the provider supports it. Never claim that an `ALLOWED_IPS` environment variable enforces provider security; the provider-side console/API setting is authoritative. Ask for fixed public egress IPs or CIDRs, not a device's private LAN address. Do not discover the public IP through a third-party service without explicit permission.
9. Create a nonsecret JSON profile conforming to [references/profile-schema.md](references/profile-schema.md). Use [references/connection-types.md](references/connection-types.md) to select the correct fields. A temporary profile may live under the project's `work/` directory and should be removed after a successful run; a retained profile must contain no values.
10. Run `scripts/configure_api.py configure --profile <profile.json> --project-root <root>` in a user-visible local terminal. The helper renders a labeled box for each variable and accepts secret values with hidden input. Do not pipe values to it or automate its stdin.
11. Let the helper update the project-root `.env`. It refuses tracked, symlinked, or hard-linked targets; adds the exact root env filename to `.gitignore`; writes atomically; avoids persistent plaintext backups; and restricts file permissions to the project owner and active local process identity where supported. Treat an ACL warning as an incomplete security step and tell the user how to tighten permissions outside the sandbox.
12. Report variable names written, the `.env` path, official docs used, remaining provider-console steps, and warnings without ever reporting values.

## Connection kinds

Read [references/connection-types.md](references/connection-types.md) when the request is not a simple static API key. It covers API/OAuth, PostgreSQL and other databases, MCP servers, Python scripts, SSH/private keys, webhooks, and custom URLs. Preserve the application's existing client/library conventions. Do not execute scripts, open database sessions, or test credentials unless the user separately requests a connection test.

Connection URLs may embed usernames, passwords, tokens, or signed query parameters. Treat the entire URL as secret whenever it contains user info or credential-like parameters. MCP configuration must reference environment variable names rather than copying secret values into `.mcp.json`. Python process configuration must use an interpreter path, script path, working directory, argument array, and environment-variable references; never concatenate user input into a shell command.

## Website Connections page

When the selected project has a website frontend, build or update its Connections/settings page as part of connection setup unless the user asks for env-only work. Read and follow [references/frontend-connections-page.md](references/frontend-connections-page.md).

The page must default to API and provide a connection-type dropdown for API, OAuth, PostgreSQL/database, MCP server, Python script, SSH/private key, webhook, and custom URL/service. Render only the fields relevant to the selected type. Private-key paths, connection URLs, secrets, and passphrases are inputs—not dropdown values—and sensitive inputs must be masked.

Never make the browser responsible for writing `.env`. Submit over same-origin to an authenticated server-side handler or server action that validates the schema and performs the local write. Never return stored values to the client; return only configured/unconfigured status and safe metadata. Never persist secrets in localStorage, sessionStorage, source code, generated JSON, analytics, error monitoring, request logs, or client caches.

For a local-development site, the server-side handler may update the root `.env` with the same safety invariants as the helper and must tell the user a process restart may be required. For a deployed site, do not write runtime `.env` unless the platform explicitly guarantees secure durable server-only storage; integrate the platform's secret manager and keep the `.env` mapping for local development.

If no user-visible interactive terminal is available, stop before collecting secrets and give the exact local command to run. Do not fall back to chat entry.

## IP allowlisting

Provider-side IP restrictions can lock out a working integration. Before directing a change, verify the official format, whether multiple IPs/CIDRs are allowed, whether changes require a new key, and which outbound address the deployed workload actually uses. Keep an emergency recovery path such as an unmodified admin session or documented key-rotation procedure. The helper validates and normalizes user-entered addresses locally, but it does not mutate the provider account.

## Private keys and multiline secrets

Prefer a variable containing a path to a permission-restricted local key file when the SDK supports it. Use a `file-path` field in the profile and a masked or path-only frontend control. Store multiline key material directly in `.env` only when official docs or the existing project explicitly require that encoding; explain the quoting convention first. Never place private-key contents in a dropdown option, DOM attribute, hidden field, or client-visible schema.

## Helper commands

Validate a generated connection profile before secret entry:

```text
python <skill-root>/scripts/configure_api.py check-profile --profile <profile.json>
```

Configure the root env file with masked prompts:

```text
python <skill-root>/scripts/configure_api.py configure --profile <profile.json> --project-root <project-root>
```

Use `--env-file` only for another root-level dotenv filename explicitly requested by the user. Use `--dry-run` to inspect the planned variable names and safeguards without prompting or writing.
