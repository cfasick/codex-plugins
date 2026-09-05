# Crypto Base Scanner Codex plugin

This local plugin exposes the documented Altrady Crypto Base Scanner API as three read-only Codex tools:

- `list_recent_bases` — bases broken less than 12 hours ago
- `list_markets` — current market drops by algorithm and exchange
- `quick_scan` — recent price drops by timeframe and exchange

## Authentication

The plugin never accepts an API key as a tool argument and does not store one in its source. Set the key in the environment that launches Codex:

```powershell
[Environment]::SetEnvironmentVariable(
  "CRYPTO_BASE_SCANNER_API_KEY",
  "PASTE_YOUR_KEY_HERE",
  "User"
)
```

Then fully restart Codex so the MCP server receives the new environment variable.

The public docs describe both an `Authorization` header and an `api_key` query parameter. The plugin defaults to `auto`: it tries the header first and retries with the query parameter only after a likely authentication error. To force one form, set `CRYPTO_BASE_SCANNER_AUTH_MODE` to `header`, `query`, or `both`.

## Documented values

- Algorithms: `original`, `day_trade`, `conservative`, `position`
- Exchanges: `BTRX`, `PLNX`, `KUCN`, `BINA`, `HITB`
- Quick-scan timeframes: `5`, `10`, `15`, `30` minutes

Responses are paginated locally with a default limit of 50 and a maximum of 500 items per call.

API documentation: https://cryptobasescanner.docs.apiary.io/

Crypto trading is risky. Scanner output is market data, not financial advice or a guarantee of performance.
