# Repository instructions

This repository is the versioned source of truth for Cory's personal Codex plugins.

- Never add or reveal API keys, passwords, passphrases, private keys, access tokens, signed URLs, credential-bearing database URLs, `.env` files, or plugin caches.
- Keep marketplace entries at `.agents/plugins/marketplace.json` aligned with plugin folders and manifest names.
- Run `python scripts/validate_repo.py` after every plugin or marketplace change.
- When a corresponding personal plugin build outside this repository changes, ask the user whether to synchronize the repository copy before finishing, unless the user already requested synchronization.
- When synchronizing a changed plugin, update its manifest version using semantic versioning: patch for compatible fixes, minor for compatible features, and major for incompatible changes.
- After synchronization, summarize the version change and changed plugin files. Commit or push only when the user requested it or has already authorized the repository workflow.
- Preserve unrelated plugin changes and never replace the whole marketplace file when adding one entry.
