# Connection type routing

API is the default and primary type. Add only fields required by official docs, the selected library, or existing project code. Never create a secret merely because it appears in this reference.

## API and OAuth

- Static API: key/token, optional secret, passphrase, account/organization ID, base URL, environment, scopes, webhook secret, and private-key path.
- OAuth: client ID, client secret, authorization URL, token URL, redirect URI, scopes, audience, tenant, and refresh-token handling.
- Record the exact header, bearer, query, or signing format from official docs.
- Research provider-side IP allowlisting and least-privilege key permissions.

## PostgreSQL and databases

Follow the application's driver and deployment platform. Prefer either its existing `DATABASE_URL` convention or discrete variables—not both unless the framework requires both.

- URL form: scheme, host, port, database, user, password, and documented query parameters such as `sslmode`.
- Discrete form: host, port, database name, user, password, SSL mode, CA certificate path, and optional schema.
- Treat a credential-bearing database URL as secret and mask it.
- Do not connect, migrate, introspect, or modify the database unless separately requested.

## MCP servers

- Determine transport: `stdio`, local process, or remote HTTP/SSE/streamable HTTP as supported.
- Local fields: command/executable, argument array, working directory, and environment-variable references.
- Remote fields: URL, transport, header names, OAuth or bearer-token environment-variable references.
- Never copy secret values into `.mcp.json`; write placeholders or environment references and keep values in `.env` or the configured secret store.
- Validate the manifest shape without launching an untrusted server unless execution is requested.

## Python scripts and local processes

- Capture interpreter path, script/module path, working directory, argument array, timeout, and required environment-variable names.
- Use argv arrays and direct process execution. Never construct a shell command from form values.
- Constrain selectable file paths to the project or an explicitly approved directory.
- Saving a configuration is not authorization to execute the script.

## SSH and private-key connections

- Capture host, port, username, known-hosts policy/file, private-key path, optional passphrase, and bastion/proxy settings when documented.
- Prefer a local permission-restricted key-file path over copying key contents into `.env`.
- Do not disable host-key verification as a convenience default.

## Webhooks

- Capture endpoint URL, signing secret, signature header/algorithm, event selection, callback verification requirements, and retry behavior.
- A provider callback URL is usually nonsecret; signed URLs and secrets are sensitive.

## Custom services

- Start with a masked URL, auth mode dropdown, username, password/token, certificate/key path, and optional nonsecret settings.
- Inspect the consuming code to avoid inventing unused variables.
- Mark uncertain requirements explicitly and obtain the missing contract before writing secrets.
