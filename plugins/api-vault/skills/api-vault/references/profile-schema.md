# Nonsecret connection profile

Create this JSON after consulting current official provider documentation or a project-local connection contract. It describes prompts and documentation; it must never contain credential values. One profile describes one selectable connection type/provider.

```json
{
  "kind": "api",
  "provider": "Kraken",
  "official_docs": [
    "https://docs.kraken.com/api/docs/guides/spot-rest-auth/"
  ],
  "uses": [
    "market data",
    "spot trading",
    "account and funding operations"
  ],
  "auth_notes": "Private REST requests use an API-Key header and an API-Sign signature.",
  "fields": [
    {
      "name": "KRAKEN_API_KEY",
      "label": "API key",
      "description": "Public identifier issued for the API credential.",
      "required": true,
      "input": "secret",
      "sensitive": true
    },
    {
      "name": "KRAKEN_API_SECRET",
      "label": "API secret",
      "description": "Signing secret paired with the API key.",
      "required": true,
      "input": "secret",
      "sensitive": true
    }
  ],
  "ip_allowlist": {
    "supported": true,
    "docs_url": "https://provider.example/official-ip-docs",
    "settings_url": "https://provider.example/account/api-settings",
    "accepted": ["ipv4", "ipv6", "cidr"],
    "env_var": null,
    "allow_non_global": false,
    "notes": "Apply these addresses in the provider console after local validation."
  }
}
```

## Rules

- `kind`: one of `api`, `oauth`, `database`, `postgresql`, `mcp`, `python-script`, `ssh`, `webhook`, or `custom`. It defaults to `api` for compatibility.
- `provider`: required nonempty display name.
- `official_docs`: array of absolute `https://` URLs. At least one is required for `api`, `oauth`, and `webhook`; use provider-owned pages whenever available. It may be empty for project-local scripts and MCP servers.
- `uses`: optional array of short documented capability summaries.
- `auth_notes`: optional nonsecret summary.
- `fields`: required nonempty array.
  - `name`: uppercase dotenv name matching `[A-Z_][A-Z0-9_]*`; names must be unique.
  - `label`: short user-facing label.
  - `description`: nonsecret explanation.
  - `required`: boolean.
  - `input`: one of `secret`, `text`, `file-path`, `url`, or `select`. Credential material defaults to `secret`. Prefer `file-path` for a private key when supported.
  - `sensitive`: boolean controlling masking. It defaults to `true` for `secret` and `url`, because connection URLs often embed credentials, and otherwise defaults to `false`.
  - `options`: required nonempty string array only for `select`. Use it for nonsecret choices such as SSL mode, environment, transport, or region—not for stored secrets or private-key contents.
- `ip_allowlist`: optional.
  - `supported`: `true`, `false`, or `null` when the docs are inconclusive.
  - `docs_url` and `settings_url`: optional absolute `https://` URLs.
  - `accepted`: optional subset of `ipv4`, `ipv6`, and `cidr`.
  - `env_var`: normally `null`. Set an uppercase dotenv name only when official docs or application code actually consumes local IP metadata.
  - `allow_non_global`: whether private, loopback, link-local, multicast, reserved, or unspecified networks may be accepted. Default `false` for public provider allowlists.
  - `notes`: provider-specific nonsecret warning or instruction.

The helper rejects unknown top-level field shapes only when they conflict with required types; this permits future nonsecret annotations without weakening validation of credential fields.
