#!/usr/bin/env python3
"""Validate the personal Codex plugin marketplace without printing secrets."""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE = ROOT / ".agents" / "plugins" / "marketplace.json"
PLUGIN_NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SEMVER = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?"
    r"(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$"
)
FORBIDDEN_NAMES = re.compile(
    r"^(?:\.env(?:\..+)?|.*\.(?:pem|key|p12|pfx)|id_(?:rsa|ed25519).*)$",
    re.IGNORECASE,
)
ALLOWED_ENV_EXAMPLES = {".env.example", ".env.sample"}
CONTENT_RULES = {
    "private-key block": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "GitHub token": re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b"),
    "OpenAI-style token": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "AWS access key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "credential assignment": re.compile(
        r"(?i)\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|private[_-]?key)"
        r"\s*[:=]\s*[\"']?[A-Za-z0-9+/=_-]{20,}"
    ),
}


def load_object(path: Path, errors: list[str]) -> dict | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        errors.append(f"invalid or unreadable JSON: {path.relative_to(ROOT)}")
        return None
    if not isinstance(value, dict):
        errors.append(f"JSON root must be an object: {path.relative_to(ROOT)}")
        return None
    return value


def validate_marketplace(errors: list[str]) -> None:
    market = load_object(MARKETPLACE, errors)
    if market is None:
        return
    plugins = market.get("plugins")
    if not isinstance(plugins, list) or not plugins:
        errors.append("marketplace plugins must be a nonempty array")
        return
    seen: set[str] = set()
    for entry in plugins:
        if not isinstance(entry, dict):
            errors.append("marketplace plugin entry must be an object")
            continue
        name = entry.get("name")
        if not isinstance(name, str) or not PLUGIN_NAME.fullmatch(name):
            errors.append(f"invalid marketplace plugin name: {name!r}")
            continue
        if name in seen:
            errors.append(f"duplicate marketplace plugin: {name}")
        seen.add(name)
        expected = f"./plugins/{name}"
        source = entry.get("source")
        if not isinstance(source, dict) or source.get("source") != "local" or source.get("path") != expected:
            errors.append(f"{name}: source must be local path {expected}")
        policy = entry.get("policy")
        if not isinstance(policy, dict) or policy.get("installation") not in {
            "AVAILABLE",
            "INSTALLED_BY_DEFAULT",
            "NOT_AVAILABLE",
        } or policy.get("authentication") not in {"ON_INSTALL", "ON_USE"}:
            errors.append(f"{name}: invalid or incomplete policy")
        if not isinstance(entry.get("category"), str) or not entry["category"].strip():
            errors.append(f"{name}: category is required")

        plugin_root = ROOT / "plugins" / name
        manifest_path = plugin_root / ".codex-plugin" / "plugin.json"
        manifest = load_object(manifest_path, errors)
        if manifest is None:
            continue
        if manifest.get("name") != name:
            errors.append(f"{name}: folder, marketplace, and manifest names must match")
        version = manifest.get("version")
        if not isinstance(version, str) or SEMVER.fullmatch(version) is None:
            errors.append(f"{name}: manifest version must be semantic versioning")


def scan_files(errors: list[str]) -> None:
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT)
        if ".git" in relative.parts:
            continue
        if path.is_symlink():
            errors.append(f"symlinks are not allowed: {relative}")
            continue
        if not path.is_file():
            continue
        if FORBIDDEN_NAMES.fullmatch(path.name) and path.name.lower() not in ALLOWED_ENV_EXAMPLES:
            errors.append(f"secret-bearing filename is not allowed: {relative}")
            continue
        if path.stat().st_size > 1_000_000:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for label, pattern in CONTENT_RULES.items():
            if pattern.search(text):
                errors.append(f"possible {label}: {relative}")


def main() -> int:
    errors: list[str] = []
    validate_marketplace(errors)
    scan_files(errors)
    if errors:
        print("Repository validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    plugin_count = len(json.loads(MARKETPLACE.read_text(encoding="utf-8"))["plugins"])
    print(f"Repository validation passed for {plugin_count} plugin(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
