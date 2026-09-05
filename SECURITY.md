# Security policy

## Credential handling

This repository must contain plugin source and nonsecret configuration only.

- Never commit `.env` files, API keys, passwords, passphrases, private keys, signed URLs, session cookies, access tokens, or credential-bearing database URLs.
- Keep MCP secrets in environment variables or a supported secret manager. Repository manifests may name required environment variables but must not contain their values.
- Use synthetic values in tests and examples.
- Rotate a credential immediately if it is committed, even if the commit is later removed.

The repository validator and GitHub workflow provide defense in depth; they are not substitutes for reviewing a diff before pushing.

## Reporting

Report suspected credential exposure privately to the repository owner. Do not open a public issue containing the credential or its full value.
