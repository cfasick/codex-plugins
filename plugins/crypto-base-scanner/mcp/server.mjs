import readline from "node:readline";

const SERVER_NAME = "Crypto Base Scanner MCP";
const SERVER_VERSION = "1.0.0";
const API_BASE_URL = "https://api.cryptobasescanner.com";
const API_KEY_ENV = "CRYPTO_BASE_SCANNER_API_KEY";
const AUTH_MODE_ENV = "CRYPTO_BASE_SCANNER_AUTH_MODE";
const ALGORITHMS = ["original", "day_trade", "conservative", "position"];
const EXCHANGE_CODES = ["BTRX", "PLNX", "KUCN", "BINA", "HITB"];
const TIMEFRAMES = [5, 10, 15, 30];
const AUTH_MODES = ["auto", "header", "query", "both"];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;
const REQUEST_TIMEOUT_MS = 30_000;

const JsonRpcError = {
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
};

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function requireObject(value, name = "arguments") {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }
  return value;
}

function optionalEnum(value, allowed, name) {
  if (value === undefined || value === null || value === "") return undefined;
  if (!allowed.includes(value)) {
    throw new Error(`${name} must be one of: ${allowed.join(", ")}.`);
  }
  return value;
}

function requiredEnum(value, allowed, name) {
  const parsed = optionalEnum(value, allowed, name);
  if (parsed === undefined) throw new Error(`${name} is required.`);
  return parsed;
}

function boundedInteger(value, name, defaultValue, minimum, maximum) {
  if (value === undefined || value === null) return defaultValue;
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }
  return value;
}

function readApiKey() {
  const key = process.env[API_KEY_ENV]?.trim();
  if (!key) {
    throw new Error(
      `${API_KEY_ENV} is not configured. Set it in your environment, restart Codex, and try again.`,
    );
  }
  return key;
}

function readAuthMode() {
  const mode = (process.env[AUTH_MODE_ENV] ?? "auto").trim().toLowerCase();
  if (!AUTH_MODES.includes(mode)) {
    throw new Error(`${AUTH_MODE_ENV} must be one of: ${AUTH_MODES.join(", ")}.`);
  }
  return mode;
}

function redact(value, secret) {
  return String(value).split(secret).join("[REDACTED]");
}

function buildRequest(pathname, query, apiKey, mode) {
  const url = new URL(pathname, API_BASE_URL);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": `crypto-base-scanner-codex-plugin/${SERVER_VERSION}`,
  };

  if (mode === "header" || mode === "both") {
    headers.Authorization = apiKey;
  }
  if (mode === "query" || mode === "both") {
    url.searchParams.set("api_key", apiKey);
  }
  return { url, headers };
}

async function fetchJson(pathname, query) {
  const apiKey = readApiKey();
  const configuredMode = readAuthMode();
  const attempts = configuredMode === "auto" ? ["header", "query"] : [configuredMode];
  let lastFailure;

  for (let index = 0; index < attempts.length; index += 1) {
    const mode = attempts[index];
    const { url, headers } = buildRequest(pathname, query, apiKey, mode);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      const bodyText = await response.text();

      if (response.ok) {
        try {
          return JSON.parse(bodyText);
        } catch {
          throw new Error("Crypto Base Scanner returned a non-JSON success response.");
        }
      }

      const safeBody = redact(bodyText, apiKey).slice(0, 1_000);
      lastFailure = new Error(
        `Crypto Base Scanner request failed with HTTP ${response.status}${safeBody ? `: ${safeBody}` : "."}`,
      );

      const mayBeAuthFailure = [400, 401, 403, 422].includes(response.status);
      if (!(configuredMode === "auto" && index === 0 && mayBeAuthFailure)) {
        throw lastFailure;
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error(`Crypto Base Scanner did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
      }
      if (configuredMode === "auto" && index === 0 && lastFailure === error) {
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastFailure ?? new Error("Crypto Base Scanner request failed.");
}

function extractRows(payload, collectionName) {
  const rows = payload?.[collectionName];
  if (!Array.isArray(rows)) {
    throw new Error(`Crypto Base Scanner response did not contain a ${collectionName} array.`);
  }
  return rows;
}

function paginate(rows, offset, limit) {
  return rows.slice(offset, offset + limit);
}

function numericValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function toolSuccess(name, request, rows, total) {
  const payload = {
    tool: name,
    request,
    returned: rows.length,
    total,
    results: rows,
  };
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function toolFailure(error) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: error instanceof Error ? error.message : String(error),
      },
    ],
  };
}

async function callListRecentBases(args) {
  const algorithm = optionalEnum(args.algorithm, ALGORITHMS, "algorithm");
  const offset = boundedInteger(args.offset, "offset", 0, 0, 100_000);
  const limit = boundedInteger(args.limit, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT);
  const payload = await fetchJson("/v1/bases", { algorithm });
  const allRows = extractRows(payload, "bases");
  const rows = paginate(allRows, offset, limit);
  return toolSuccess("list_recent_bases", { algorithm, offset, limit }, rows, allRows.length);
}

async function callListMarkets(args) {
  const algorithm = requiredEnum(args.algorithm, ALGORITHMS, "algorithm");
  const exchangeCode = requiredEnum(args.exchange_code, EXCHANGE_CODES, "exchange_code");
  const offset = boundedInteger(args.offset, "offset", 0, 0, 100_000);
  const limit = boundedInteger(args.limit, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT);
  const payload = await fetchJson("/v1/markets", {
    algorithm,
    exchange_code: exchangeCode,
  });
  const allRows = extractRows(payload, "markets");
  const rows = paginate(allRows, offset, limit);
  return toolSuccess(
    "list_markets",
    { algorithm, exchange_code: exchangeCode, offset, limit },
    rows,
    allRows.length,
  );
}

async function callQuickScan(args) {
  const timeframe = requiredEnum(args.timeframe, TIMEFRAMES, "timeframe");
  const exchangeCode = requiredEnum(args.exchange_code, EXCHANGE_CODES, "exchange_code");
  const offset = boundedInteger(args.offset, "offset", 0, 0, 100_000);
  const limit = boundedInteger(args.limit, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT);
  const minimumDrop = args.minimum_drop ?? 0;
  if (typeof minimumDrop !== "number" || !Number.isFinite(minimumDrop)) {
    throw new Error("minimum_drop must be a finite number.");
  }

  const payload = await fetchJson("/v1/markets/quick_scan", {
    timeframe,
    exchange_code: exchangeCode,
  });
  const allRows = extractRows(payload, "markets")
    .filter((row) => numericValue(row?.drop) >= minimumDrop)
    .sort((left, right) => numericValue(right?.drop) - numericValue(left?.drop));
  const rows = paginate(allRows, offset, limit);
  return toolSuccess(
    "quick_scan",
    { timeframe, exchange_code: exchangeCode, minimum_drop: minimumDrop, offset, limit },
    rows,
    allRows.length,
  );
}

const tools = [
  {
    name: "list_recent_bases",
    title: "List Recent Broken Bases",
    description:
      "Read Crypto Base Scanner bases broken less than 12 hours ago. Optionally filter by scanner algorithm.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        algorithm: {
          type: "string",
          enum: ALGORITHMS,
          description: "Optional scanner algorithm filter.",
        },
        offset: { type: "integer", minimum: 0, default: 0 },
        limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "list_markets",
    title: "List Market Drops",
    description:
      "Read markets and their current drops for one documented scanner algorithm and exchange.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        algorithm: { type: "string", enum: ALGORITHMS },
        exchange_code: {
          type: "string",
          enum: EXCHANGE_CODES,
          description: "BTRX=Bittrex, PLNX=Poloniex, KUCN=KuCoin, BINA=Binance, HITB=HitBTC.",
        },
        offset: { type: "integer", minimum: 0, default: 0 },
        limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
      },
      required: ["algorithm", "exchange_code"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "quick_scan",
    title: "Run Market Quick Scan",
    description:
      "Read market price drops for a documented timeframe and exchange, sorted by largest drop first.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        timeframe: { type: "integer", enum: TIMEFRAMES, description: "Timeframe in minutes." },
        exchange_code: {
          type: "string",
          enum: EXCHANGE_CODES,
          description: "BTRX=Bittrex, PLNX=Poloniex, KUCN=KuCoin, BINA=Binance, HITB=HitBTC.",
        },
        minimum_drop: {
          type: "number",
          default: 0,
          description: "Client-side minimum drop filter applied before pagination.",
        },
        offset: { type: "integer", minimum: 0, default: 0 },
        limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
      },
      required: ["timeframe", "exchange_code"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
];

async function handleRequest(message) {
  const { id, method, params } = message;

  if (method === "initialize") {
    sendResult(id, {
      protocolVersion: params?.protocolVersion ?? "2025-11-25",
      capabilities: { tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      instructions:
        "Use these read-only tools to inspect Altrady Crypto Base Scanner data. Never ask for or pass an API key as a tool argument; authentication comes from CRYPTO_BASE_SCANNER_API_KEY.",
    });
    return;
  }

  if (method === "ping") {
    sendResult(id, {});
    return;
  }

  if (method === "tools/list") {
    sendResult(id, { tools });
    return;
  }

  if (method === "tools/call") {
    const args = requireObject(params?.arguments);
    try {
      let result;
      if (params?.name === "list_recent_bases") result = await callListRecentBases(args);
      else if (params?.name === "list_markets") result = await callListMarkets(args);
      else if (params?.name === "quick_scan") result = await callQuickScan(args);
      else throw new Error(`Unknown tool: ${params?.name ?? ""}`);
      sendResult(id, result);
    } catch (error) {
      sendResult(id, toolFailure(error));
    }
    return;
  }

  if (id !== undefined) {
    sendError(id, JsonRpcError.METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

lines.on("line", (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }
  void handleRequest(message).catch((error) => {
    if (message.id !== undefined) {
      sendError(
        message.id,
        JsonRpcError.INVALID_PARAMS,
        error instanceof Error ? error.message : String(error),
      );
    }
  });
});
