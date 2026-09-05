# Secure website Connections page

Adapt to the project's existing framework, router, component library, validation library, authentication, and styling. Prefer an existing settings/admin area; otherwise create a route such as `/settings/connections` with the project's normal navigation and access control.

## Required interface

- Title and brief explanation that credentials are stored server-side.
- Connection-type dropdown with API first, followed by OAuth, PostgreSQL/database, MCP server, Python script, SSH/private key, webhook, and custom URL/service.
- Provider/name field and dynamic inputs for the selected type.
- Masked controls for API keys, secrets, passwords, passphrases, signed URLs, and credential-bearing database URLs.
- File-path controls for private keys, certificates, Python interpreters, and scripts. A browser file picker must not imply that a client file can become a durable server path.
- Nonsecret dropdowns for auth mode, sandbox/production, transport, SSL mode, and other documented enumerations.
- Optional IP-allowlist section only when supported or explicitly configured.
- Save button, safe validation errors, configured/unconfigured status, last-updated metadata, and restart-required notice for local `.env` updates.
- Never prefill a stored secret. A blank secret field means retain the existing value unless the UI explicitly offers a separately confirmed removal action.

## Client/server boundary

The browser sends entered values only to a same-origin authenticated server-side handler or server action. Use TLS except on loopback development. Require the application's normal admin authorization and CSRF protection. Disable caching and redact request bodies, validation objects, exceptions, tracing, analytics, and error reporting.

The response may contain variable names, connection type, configured booleans, and safe timestamps. It must never return secret values, even masked fragments unless the user explicitly needs provider-issued identifying suffixes and the risk is acceptable.

Do not persist the form in localStorage, sessionStorage, IndexedDB, service-worker caches, URL parameters, cookies, Redux persistence, or form analytics. Clear sensitive client state after a successful save.

## Local `.env` handler

For local development only, the server handler must enforce the helper's invariants:

- target a single approved root-level dotenv filename;
- refuse tracked, symlinked, or hard-linked targets;
- preserve unrelated lines and reject duplicate assignments;
- add the exact file to root `.gitignore` before writing;
- use an atomic same-directory replacement without a plaintext backup;
- tighten permissions when the OS permits it and surface a warning otherwise;
- serialize values safely and never log them.

Use a server-side lock to prevent concurrent writes. Do not expose a general-purpose filename, path, command, or environment-variable-name parameter to the browser; accept only IDs from a server-owned schema.

## Production deployments

Do not assume a deployed process can safely or durably modify `.env`. Detect the hosting model and use its server-side secret manager or encrypted environment configuration. Keep client code independent of the storage backend. If no secure production storage is available, build the page in read-only/configuration-instructions mode rather than accepting secrets deceptively.

## Verification

Test that unauthenticated and non-admin requests fail, stored secrets never appear in HTML/JSON/logs, type switching renders the correct schema, invalid URLs and paths are rejected, blank secret fields preserve existing values, duplicate submissions cannot corrupt `.env`, and a restart notice appears when required. Do not use real credentials in tests.
