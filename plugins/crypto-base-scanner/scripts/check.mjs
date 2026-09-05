import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const childEnv = { ...process.env };
delete childEnv.CRYPTO_BASE_SCANNER_API_KEY;

const child = spawn(process.execPath, [path.join(pluginRoot, "mcp", "server.mjs")], {
  cwd: pluginRoot,
  env: childEnv,
  stdio: ["pipe", "pipe", "inherit"],
});

const responses = new Map();
const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
lines.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.id !== undefined) responses.set(message.id, message);
});

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

async function waitFor(id) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (responses.has(id)) return responses.get(id);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for JSON-RPC response ${id}.`);
}

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25" } });
const initialized = await waitFor(1);
assert.equal(initialized.result.serverInfo.name, "Crypto Base Scanner MCP");

send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
const listed = await waitFor(2);
assert.deepEqual(
  listed.result.tools.map((tool) => tool.name),
  ["list_recent_bases", "list_markets", "quick_scan"],
);

send({
  jsonrpc: "2.0",
  id: 3,
  method: "tools/call",
  params: { name: "list_recent_bases", arguments: { limit: 1 } },
});
const missingKey = await waitFor(3);
assert.equal(missingKey.result.isError, true);
assert.match(missingKey.result.content[0].text, /CRYPTO_BASE_SCANNER_API_KEY/);

child.stdin.end();
await new Promise((resolve, reject) => {
  child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Server exited with ${code}.`))));
});

console.log("Crypto Base Scanner MCP checks passed.");
