# Codex Plugins

Personal Codex plugins maintained by [cfasick](https://github.com/cfasick).

## Plugins

| Plugin | Purpose |
| --- | --- |
| `api-vault` | Research API and connection requirements, configure local environment variables, and build secure connection settings pages. |
| `crypto-base-scanner` | Read Altrady Crypto Base Scanner bases, markets, and quick-scan results through a local MCP server. |

Read the [plugin documentation](docs/index.md) for capabilities, configuration, and security behavior.

## Install the marketplace

Clone this repository, then register its root as a local Codex marketplace:

```powershell
codex plugin marketplace add C:\path\to\codex-plugins
```

Install either plugin:

```powershell
codex plugin add api-vault@cfasick-plugins
codex plugin add crypto-base-scanner@cfasick-plugins
```

Start a new Codex task after installing or updating a plugin so its skills and tools are loaded.

## Development

Plugin source lives under `plugins/`. Marketplace metadata lives at `.agents/plugins/marketplace.json`.

Run the repository checks before committing:

```powershell
python scripts/validate_repo.py
```

The validator checks marketplace paths, plugin manifests, semantic versions, symlinks, secret-bearing filenames, private keys, and common credential patterns. It reports paths and rule names without printing suspected values.

Before changing a plugin, read [CONTRIBUTING.md](CONTRIBUTING.md). Changes made to a personal build should be synchronized back into this repository with an appropriate version update.

## Security

Never commit `.env` files, credentials, private keys, database URLs containing passwords, or generated plugin caches. See [SECURITY.md](SECURITY.md).
