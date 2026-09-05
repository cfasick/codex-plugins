// Generated US crypto exchange registry.
// Secrets belong in a vault/env store, never in this file.
export type Availability = boolean | string;

export interface ExchangeRegistryEntry {
  id: string;
  name: string;
  us_status: string;
  docs_url: string;
  rest_base_url?: string | null;
  ws_public_url?: string | null;
  ws_private_url?: string | null;
  ws_trading_url?: string | null;
  auth: {
    type: string;
    fields: string[];
    env: string[];
  };
  capabilities: Record<string, Availability>;
  integration_status?: string;
}

export const US_CRYPTO_EXCHANGES: ExchangeRegistryEntry[] = [
  {
    "id": "coinbase",
    "name": "Coinbase Advanced",
    "us_status": "production",
    "docs_url": "https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/introduction",
    "rest_base_url": "https://api.coinbase.com/api/v3/brokerage",
    "ws_public_url": "wss://advanced-trade-ws.coinbase.com",
    "ws_private_url": "wss://advanced-trade-ws-user.coinbase.com",
    "auth": {
      "type": "jwt_es256",
      "fields": [
        "api_key_name",
        "private_key_pem"
      ],
      "env": [
        "COINBASE_API_KEY_NAME",
        "COINBASE_PRIVATE_KEY"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": false,
      "derivatives": "account/jurisdiction dependent",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": "restricted/permission dependent"
    }
  },
  {
    "id": "kraken",
    "name": "Kraken / Kraken Pro",
    "us_status": "production",
    "docs_url": "https://docs.kraken.com/",
    "rest_base_url": "https://api.kraken.com",
    "ws_public_url": "wss://ws.kraken.com/v2",
    "ws_private_url": "wss://ws-auth.kraken.com/v2",
    "auth": {
      "type": "api_key_hmac_sha512",
      "fields": [
        "api_key",
        "api_secret"
      ],
      "env": [
        "KRAKEN_API_KEY",
        "KRAKEN_API_SECRET"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": true,
      "derivatives": "product/account/jurisdiction dependent",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "robinhood_crypto",
    "name": "Robinhood Crypto",
    "us_status": "production",
    "docs_url": "https://docs.robinhood.com/",
    "rest_base_url": "https://trading.robinhood.com",
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "ed25519_signature",
      "fields": [
        "api_key",
        "private_key_base64"
      ],
      "env": [
        "ROBINHOOD_API_KEY",
        "ROBINHOOD_PRIVATE_KEY"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": "limited/use external history if needed",
      "order_book": "limited",
      "private_balances": true,
      "spot_trading": true,
      "margin": false,
      "derivatives": false,
      "websocket": false,
      "portfolio_tracking": true,
      "withdrawals_api": false
    }
  },
  {
    "id": "gemini",
    "name": "Gemini",
    "us_status": "production",
    "docs_url": "https://docs.gemini.com/",
    "rest_base_url": "https://api.gemini.com",
    "ws_public_url": "wss://api.gemini.com/v1/marketdata",
    "ws_private_url": "wss://api.gemini.com/v1/order/events",
    "auth": {
      "type": "api_key_hmac_sha384",
      "fields": [
        "api_key",
        "api_secret"
      ],
      "env": [
        "GEMINI_API_KEY",
        "GEMINI_API_SECRET"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": false,
      "derivatives": "not for standard US spot account",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "crypto_com",
    "name": "Crypto.com Exchange",
    "us_status": "verify_us_account",
    "docs_url": "https://exchange-docs.crypto.com/exchange/v1/rest-ws/index.html",
    "rest_base_url": "https://api.crypto.com/exchange/v1",
    "ws_public_url": "wss://stream.crypto.com/exchange/v1/market",
    "ws_private_url": "wss://stream.crypto.com/exchange/v1/user",
    "auth": {
      "type": "api_key_hmac_sha256",
      "fields": [
        "api_key",
        "api_secret"
      ],
      "env": [
        "CRYPTOCOM_API_KEY",
        "CRYPTOCOM_API_SECRET"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": "account/jurisdiction dependent",
      "derivatives": "account/jurisdiction dependent",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "binance_us",
    "name": "Binance.US",
    "us_status": "production",
    "docs_url": "https://docs.binance.us/",
    "rest_base_url": "https://api.binance.us",
    "ws_public_url": "wss://stream.binance.us:9443",
    "ws_private_url": "wss://stream.binance.us:9443",
    "ws_trading_url": "wss://ws-api.binance.us:443/ws-api/v3",
    "auth": {
      "type": "api_key_hmac_sha256",
      "fields": [
        "api_key",
        "api_secret"
      ],
      "env": [
        "BINANCE_US_API_KEY",
        "BINANCE_US_API_SECRET"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": false,
      "derivatives": false,
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "okx_us",
    "name": "OKX US",
    "us_status": "verify_us_account",
    "docs_url": "https://www.okx.com/docs-v5/en/",
    "rest_base_url": "https://us.okx.com",
    "ws_public_url": "wss://wspap.okx.com:8443/ws/v5/public",
    "ws_private_url": "wss://wspap.okx.com:8443/ws/v5/private",
    "auth": {
      "type": "api_key_hmac_sha256_passphrase",
      "fields": [
        "api_key",
        "api_secret",
        "passphrase"
      ],
      "env": [
        "OKX_US_API_KEY",
        "OKX_US_API_SECRET",
        "OKX_US_API_PASSPHRASE"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": "US product availability must be checked",
      "derivatives": "US product availability must be checked",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "bitstamp",
    "name": "Bitstamp",
    "us_status": "production",
    "docs_url": "https://www.bitstamp.net/api/",
    "rest_base_url": "https://www.bitstamp.net/api/v2",
    "ws_public_url": "wss://ws.bitstamp.net",
    "ws_private_url": "wss://ws.bitstamp.net",
    "auth": {
      "type": "api_key_hmac_sha256",
      "fields": [
        "api_key",
        "api_secret"
      ],
      "env": [
        "BITSTAMP_API_KEY",
        "BITSTAMP_API_SECRET"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": "entity/product dependent",
      "derivatives": "entity/product dependent",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "uphold",
    "name": "Uphold",
    "us_status": "production",
    "docs_url": "https://developer.uphold.com/",
    "rest_base_url": "https://api.uphold.com",
    "ws_public_url": null,
    "ws_private_url": "wss://stream.uphold.com",
    "auth": {
      "type": "oauth2_or_personal_access_token",
      "fields": [
        "access_token"
      ],
      "env": [
        "UPHOLD_ACCESS_TOKEN"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": "limited",
      "order_book": "not exchange-style",
      "private_balances": true,
      "spot_trading": true,
      "margin": false,
      "derivatives": false,
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "cexio",
    "name": "CEX.IO",
    "us_status": "verify_us_account",
    "docs_url": "https://docs.cex.io/",
    "rest_base_url": "https://cex.io/api",
    "ws_public_url": "wss://ws.cex.io/ws/",
    "ws_private_url": "wss://ws.cex.io/ws/",
    "auth": {
      "type": "api_key_hmac",
      "fields": [
        "user_id",
        "api_key",
        "api_secret"
      ],
      "env": [
        "CEXIO_USER_ID",
        "CEXIO_API_KEY",
        "CEXIO_API_SECRET"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": "availability dependent",
      "derivatives": "availability dependent",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "bitmart",
    "name": "BitMart",
    "us_status": "verify_us_account",
    "docs_url": "https://developer-pro.bitmart.com/",
    "rest_base_url": "https://api-cloud.bitmart.com",
    "ws_public_url": "wss://ws-manager-compress.bitmart.com/api?protocol=1.1",
    "ws_private_url": "wss://ws-manager-compress.bitmart.com/user?protocol=1.1",
    "auth": {
      "type": "api_key_hmac_sha256_memo",
      "fields": [
        "api_key",
        "api_secret",
        "memo"
      ],
      "env": [
        "BITMART_API_KEY",
        "BITMART_API_SECRET",
        "BITMART_API_MEMO"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": "jurisdiction dependent",
      "derivatives": "jurisdiction dependent",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": true
    }
  },
  {
    "id": "coinzoom",
    "name": "CoinZoom",
    "us_status": "verify_us_account",
    "docs_url": "https://www.coinzoom.com/api-docs/",
    "rest_base_url": null,
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "api_credentials",
      "fields": [
        "api_key",
        "api_secret"
      ],
      "env": [
        "COINZOOM_API_KEY",
        "COINZOOM_API_SECRET"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": "verify",
      "order_book": "verify",
      "private_balances": true,
      "spot_trading": true,
      "margin": false,
      "derivatives": false,
      "websocket": "verify",
      "portfolio_tracking": true,
      "withdrawals_api": "verify"
    },
    "integration_status": "review_required"
  },
  {
    "id": "etoro_us",
    "name": "eToro US",
    "us_status": "verify_us_account",
    "docs_url": "https://www.etoro.com/customer-service/api/",
    "rest_base_url": null,
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "developer_api",
      "fields": [],
      "env": []
    },
    "capabilities": {
      "public_market_data": "verify",
      "candles": "verify",
      "order_book": false,
      "private_balances": "verify",
      "spot_trading": "verify",
      "margin": false,
      "derivatives": false,
      "websocket": "verify",
      "portfolio_tracking": "verify",
      "withdrawals_api": false
    },
    "integration_status": "review_required"
  },
  {
    "id": "bullish",
    "name": "Bullish",
    "us_status": "institutional_review",
    "docs_url": "https://api.exchange.bullish.com/docs/api/rest/",
    "rest_base_url": "https://api.exchange.bullish.com",
    "ws_public_url": "wss://api.exchange.bullish.com/trading-api/v1/market-data",
    "ws_private_url": "wss://api.exchange.bullish.com/trading-api/v1/private-data",
    "auth": {
      "type": "jwt_or_hmac_account_dependent",
      "fields": [
        "api_key",
        "private_key_or_secret"
      ],
      "env": [
        "BULLISH_API_KEY",
        "BULLISH_PRIVATE_KEY"
      ]
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": true,
      "derivatives": true,
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": "account dependent"
    },
    "integration_status": "institutional_review"
  },
  {
    "id": "falconx",
    "name": "FalconX",
    "us_status": "institutional_review",
    "docs_url": "https://docs.falconx.io/",
    "rest_base_url": null,
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "institutional_credentials",
      "fields": [],
      "env": []
    },
    "capabilities": {
      "public_market_data": "client access",
      "candles": "client access",
      "order_book": "client access",
      "private_balances": true,
      "spot_trading": true,
      "margin": "institutional",
      "derivatives": "institutional",
      "websocket": "client access",
      "portfolio_tracking": true,
      "withdrawals_api": "client access"
    },
    "integration_status": "institutional_review"
  },
  {
    "id": "lmax_digital",
    "name": "LMAX Digital",
    "us_status": "institutional_review",
    "docs_url": "https://docs.lmax.com/",
    "rest_base_url": null,
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "institutional_credentials",
      "fields": [],
      "env": []
    },
    "capabilities": {
      "public_market_data": "client access",
      "candles": "client access",
      "order_book": true,
      "private_balances": true,
      "spot_trading": true,
      "margin": "product dependent",
      "derivatives": true,
      "websocket": "product dependent",
      "portfolio_tracking": true,
      "withdrawals_api": "custody product"
    },
    "integration_status": "institutional_review"
  },
  {
    "id": "coinlist",
    "name": "CoinList",
    "us_status": "verify_us_account",
    "docs_url": "https://coinlist.co/api",
    "rest_base_url": null,
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "partner_or_account_api",
      "fields": [],
      "env": []
    },
    "capabilities": {
      "public_market_data": "verify",
      "candles": "verify",
      "order_book": "verify",
      "private_balances": "verify",
      "spot_trading": "verify",
      "margin": false,
      "derivatives": false,
      "websocket": "verify",
      "portfolio_tracking": "verify",
      "withdrawals_api": "verify"
    },
    "integration_status": "review_required"
  },
  {
    "id": "interactive_brokers_crypto",
    "name": "Interactive Brokers Crypto",
    "us_status": "production_broker",
    "docs_url": "https://www.interactivebrokers.com/campus/ibkr-api-page/",
    "rest_base_url": null,
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "ibkr_session_oauth",
      "fields": [],
      "env": []
    },
    "capabilities": {
      "public_market_data": true,
      "candles": true,
      "order_book": "broker dependent",
      "private_balances": true,
      "spot_trading": true,
      "margin": "not assume for crypto",
      "derivatives": "separate regulated products",
      "websocket": true,
      "portfolio_tracking": true,
      "withdrawals_api": false
    },
    "integration_status": "broker_adapter"
  },
  {
    "id": "bakkt",
    "name": "Bakkt",
    "us_status": "institutional_review",
    "docs_url": "https://developers.bakkt.com/",
    "rest_base_url": null,
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "partner_credentials",
      "fields": [],
      "env": []
    },
    "capabilities": {
      "public_market_data": "partner access",
      "candles": "partner access",
      "order_book": "partner access",
      "private_balances": true,
      "spot_trading": "partner/product dependent",
      "margin": false,
      "derivatives": "separate products",
      "websocket": "partner access",
      "portfolio_tracking": true,
      "withdrawals_api": "partner access"
    },
    "integration_status": "institutional_review"
  },
  {
    "id": "tzero",
    "name": "tZERO",
    "us_status": "specialized_review",
    "docs_url": "https://www.tzero.com/",
    "rest_base_url": null,
    "ws_public_url": null,
    "ws_private_url": null,
    "auth": {
      "type": "partner_or_broker_credentials",
      "fields": [],
      "env": []
    },
    "capabilities": {
      "public_market_data": "verify",
      "candles": "verify",
      "order_book": "verify",
      "private_balances": "verify",
      "spot_trading": "specialized digital securities/crypto products",
      "margin": false,
      "derivatives": false,
      "websocket": "verify",
      "portfolio_tracking": "verify",
      "withdrawals_api": "verify"
    },
    "integration_status": "specialized_review"
  }
];
