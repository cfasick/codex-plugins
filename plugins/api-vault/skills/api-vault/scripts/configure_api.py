#!/usr/bin/env python3
"""Safely write API and connection settings to a project-root dotenv file.

This helper deliberately performs no network requests. A Codex skill researches
official documentation and supplies a nonsecret profile; secret values are read
only from this process's interactive terminal.
"""

from __future__ import annotations

import argparse
import csv
import ctypes
import getpass
import ipaddress
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from typing import Any, Callable
from urllib.parse import urlparse


ENV_NAME = re.compile(r"^[A-Z_][A-Z0-9_]*$")
ENV_ASSIGNMENT = re.compile(r"^(\s*)(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=.*$")
INPUT_TYPES = {"secret", "text", "file-path", "url", "select"}
IP_FORMATS = {"ipv4", "ipv6", "cidr"}
CONNECTION_KINDS = {
    "api",
    "oauth",
    "database",
    "postgresql",
    "mcp",
    "python-script",
    "ssh",
    "webhook",
    "custom",
}
KINDS_REQUIRING_OFFICIAL_DOCS = {"api", "oauth", "webhook"}


class VaultError(RuntimeError):
    pass


def _https_url(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise VaultError(f"{label} must be a nonempty HTTPS URL")
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        raise VaultError(f"{label} must be an absolute HTTPS URL without embedded credentials")
    return value


def load_profile(path: Path) -> dict[str, Any]:
    try:
        profile = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise VaultError(f"Cannot read profile: {exc}") from exc
    if not isinstance(profile, dict):
        raise VaultError("Profile must be a JSON object")

    kind = profile.get("kind", "api")
    if kind not in CONNECTION_KINDS:
        raise VaultError("kind must be one of: " + ", ".join(sorted(CONNECTION_KINDS)))
    profile["kind"] = kind

    provider = profile.get("provider")
    if not isinstance(provider, str) or not provider.strip():
        raise VaultError("provider must be a nonempty string")

    docs = profile.get("official_docs", [])
    if not isinstance(docs, list):
        raise VaultError("official_docs must be an array")
    if kind in KINDS_REQUIRING_OFFICIAL_DOCS and not docs:
        raise VaultError(f"official_docs is required for {kind} connections")
    profile["official_docs"] = [_https_url(url, "official_docs item") for url in docs]

    fields = profile.get("fields")
    if not isinstance(fields, list) or not fields:
        raise VaultError("fields must be a nonempty array")
    seen: set[str] = set()
    normalized_fields: list[dict[str, Any]] = []
    for index, raw in enumerate(fields, start=1):
        if not isinstance(raw, dict):
            raise VaultError(f"fields[{index}] must be an object")
        name = raw.get("name")
        if not isinstance(name, str) or not ENV_NAME.fullmatch(name):
            raise VaultError(f"fields[{index}].name is not a safe uppercase dotenv name")
        if name in seen:
            raise VaultError(f"Duplicate field name: {name}")
        seen.add(name)
        input_type = raw.get("input", "secret")
        if input_type not in INPUT_TYPES:
            raise VaultError(f"{name}.input must be one of: {', '.join(sorted(INPUT_TYPES))}")
        required = raw.get("required", True)
        if not isinstance(required, bool):
            raise VaultError(f"{name}.required must be true or false")
        label = raw.get("label", name)
        description = raw.get("description", "")
        if not isinstance(label, str) or not isinstance(description, str):
            raise VaultError(f"{name} label and description must be strings")
        sensitive = raw.get("sensitive", input_type in {"secret", "url"})
        if not isinstance(sensitive, bool):
            raise VaultError(f"{name}.sensitive must be true or false")
        options = raw.get("options", [])
        if input_type == "select":
            if (
                not isinstance(options, list)
                or not options
                or not all(isinstance(option, str) and option for option in options)
            ):
                raise VaultError(f"{name}.options must contain choices for a select field")
        elif options:
            raise VaultError(f"{name}.options is only valid for a select field")
        normalized_fields.append(
            {
                "name": name,
                "label": label.strip() or name,
                "description": description.strip(),
                "required": required,
                "input": input_type,
                "sensitive": sensitive,
                "options": options,
            }
        )
    profile["fields"] = normalized_fields

    ip_config = profile.get("ip_allowlist")
    if ip_config is not None:
        if not isinstance(ip_config, dict):
            raise VaultError("ip_allowlist must be an object")
        supported = ip_config.get("supported")
        if supported not in (True, False, None):
            raise VaultError("ip_allowlist.supported must be true, false, or null")
        for key in ("docs_url", "settings_url"):
            if ip_config.get(key) is not None:
                _https_url(ip_config[key], f"ip_allowlist.{key}")
        accepted = ip_config.get("accepted", ["ipv4", "ipv6", "cidr"])
        if not isinstance(accepted, list) or not accepted or not set(accepted) <= IP_FORMATS:
            raise VaultError("ip_allowlist.accepted contains an unsupported address format")
        env_var = ip_config.get("env_var")
        if env_var is not None:
            if not isinstance(env_var, str) or not ENV_NAME.fullmatch(env_var):
                raise VaultError("ip_allowlist.env_var must be null or a safe uppercase dotenv name")
            if env_var in seen:
                raise VaultError(f"Duplicate field name: {env_var}")
        if not isinstance(ip_config.get("allow_non_global", False), bool):
            raise VaultError("ip_allowlist.allow_non_global must be true or false")
    return profile


def resolve_target(project_root: Path, env_file: str) -> tuple[Path, Path]:
    root = project_root.expanduser().resolve(strict=True)
    if not root.is_dir():
        raise VaultError("project root is not a directory")
    if Path(env_file).name != env_file or env_file in {"", ".", ".."}:
        raise VaultError("env filename must be a single root-level filename")
    target = root / env_file
    if target.is_symlink():
        raise VaultError("refusing to write a symlinked env file")
    if target.exists():
        stat = target.stat()
        if not target.is_file():
            raise VaultError("env target exists but is not a regular file")
        if stat.st_nlink > 1:
            raise VaultError("refusing to write a hard-linked env file")
    return root, target


def is_git_tracked(root: Path, target: Path) -> bool:
    relative = target.relative_to(root).as_posix()
    result = subprocess.run(
        ["git", "-C", str(root), "ls-files", "--error-unmatch", "--", relative],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def _atomic_text_write(path: Path, text: str, secure: bool) -> bool:
    fd, temp_name = tempfile.mkstemp(prefix=".api-vault-", dir=path.parent, text=True)
    temp = Path(temp_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        hardened = harden_permissions(temp) if secure else True
        os.replace(temp, path)
        return hardened
    finally:
        if temp.exists():
            temp.unlink()


def _windows_current_sid() -> str:
    result = subprocess.run(
        ["whoami", "/user", "/fo", "csv", "/nh"],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise VaultError("could not determine the current Windows user SID")
    rows = list(csv.reader(result.stdout.splitlines()))
    if not rows or len(rows[0]) < 2 or not rows[0][1].startswith("S-"):
        raise VaultError("could not parse the current Windows user SID")
    return rows[0][1]


def _windows_owner_sid(path: Path) -> str:
    from ctypes import wintypes

    owner_sid = ctypes.c_void_p()
    security_descriptor = ctypes.c_void_p()
    advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    get_security_info = advapi32.GetNamedSecurityInfoW
    get_security_info.argtypes = [
        wintypes.LPWSTR,
        wintypes.DWORD,
        wintypes.DWORD,
        ctypes.POINTER(ctypes.c_void_p),
        ctypes.c_void_p,
        ctypes.c_void_p,
        ctypes.c_void_p,
        ctypes.POINTER(ctypes.c_void_p),
    ]
    get_security_info.restype = wintypes.DWORD
    result = get_security_info(
        str(path.resolve()),
        1,  # SE_FILE_OBJECT
        1,  # OWNER_SECURITY_INFORMATION
        ctypes.byref(owner_sid),
        None,
        None,
        None,
        ctypes.byref(security_descriptor),
    )
    if result != 0:
        raise VaultError(f"could not determine the Windows project owner SID (error {result})")
    sid_text = ctypes.c_wchar_p()
    try:
        convert_sid = advapi32.ConvertSidToStringSidW
        convert_sid.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_wchar_p)]
        convert_sid.restype = wintypes.BOOL
        if not convert_sid(owner_sid, ctypes.byref(sid_text)):
            raise VaultError("could not convert the Windows project owner SID")
        return sid_text.value
    finally:
        if sid_text:
            kernel32.LocalFree(sid_text)
        if security_descriptor:
            kernel32.LocalFree(security_descriptor)


def harden_permissions(path: Path) -> bool:
    if os.name != "nt":
        os.chmod(path, 0o600)
        return True
    owner_sid = _windows_owner_sid(path.parent)
    current_sid = _windows_current_sid()
    grants = [f"*{owner_sid}:(F)"]
    if current_sid != owner_sid:
        grants.append(f"*{current_sid}:(F)")
    result = subprocess.run(
        ["icacls", str(path), "/inheritance:r", "/grant:r", *grants],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        # Sandboxed Windows processes may be allowed to write the project but
        # forbidden to alter ACLs. Preserve the inherited project ACL and make
        # the incomplete hardening visible to the user instead of silently
        # claiming success.
        return False
    return True


def ensure_gitignore(root: Path, env_file: str) -> None:
    gitignore = root / ".gitignore"
    if gitignore.is_symlink():
        raise VaultError("refusing to modify a symlinked .gitignore")
    existing = gitignore.read_text(encoding="utf-8") if gitignore.exists() else ""
    rule = f"/{env_file}"
    rules = {line.strip() for line in existing.splitlines()}
    if rule in rules or env_file in rules:
        return
    prefix = "" if not existing or existing.endswith(("\n", "\r")) else "\n"
    updated = existing + prefix + "# API Vault: local credentials\n" + rule + "\n"
    _atomic_text_write(gitignore, updated, secure=False)


def quote_dotenv(value: str) -> str:
    if "\x00" in value:
        raise VaultError("credential values cannot contain NUL bytes")
    safe = re.fullmatch(r"[A-Za-z0-9_./:@+%,-]+", value)
    if safe and value:
        return value
    escaped = (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\r", "\\r")
        .replace("\n", "\\n")
        .replace("\t", "\\t")
    )
    return f'"{escaped}"'


def update_dotenv(existing: str, values: dict[str, str], provider: str, source: str) -> str:
    lines = existing.splitlines(keepends=True)
    occurrences: dict[str, list[int]] = {name: [] for name in values}
    for index, line in enumerate(lines):
        match = ENV_ASSIGNMENT.match(line.rstrip("\r\n"))
        if match and match.group(2) in occurrences:
            occurrences[match.group(2)].append(index)
    duplicates = [name for name, indexes in occurrences.items() if len(indexes) > 1]
    if duplicates:
        raise VaultError("duplicate assignments must be resolved first: " + ", ".join(duplicates))

    for name, indexes in occurrences.items():
        if indexes:
            ending = "\r\n" if lines[indexes[0]].endswith("\r\n") else "\n"
            lines[indexes[0]] = f"{name}={quote_dotenv(values[name])}{ending}"

    missing = [name for name, indexes in occurrences.items() if not indexes]
    result = "".join(lines)
    if missing:
        if result and not result.endswith(("\n", "\r")):
            result += "\n"
        if result and not result.endswith("\n\n"):
            result += "\n"
        result += f"# API Vault: {provider}\n# Configuration source: {source}\n"
        for name in missing:
            result += f"{name}={quote_dotenv(values[name])}\n"
    return result


def _box(index: int, field: dict[str, Any]) -> None:
    required = "required" if field["required"] else "optional"
    print("+------------------------------------------------------------+")
    print(f"| Credential {index}: {field['name']}")
    visibility = "masked" if field.get("sensitive") else "visible"
    print(f"| {field['label']} ({required}; {field['input']}; {visibility})")
    if field["description"]:
        print(f"| {field['description']}")
    print("+------------------------------------------------------------+")


def collect_values(
    profile: dict[str, Any],
    secret_reader: Callable[[str], str] = getpass.getpass,
    text_reader: Callable[[str], str] = input,
    existing_names: set[str] | None = None,
) -> dict[str, str]:
    existing_names = existing_names or set()
    values: dict[str, str] = {}
    for index, field in enumerate(profile["fields"], start=1):
        _box(index, field)
        while True:
            if field["input"] == "select":
                options = field["options"]
                for option_index, option in enumerate(options, start=1):
                    print(f"  {option_index}. {option}")
                selection = text_reader("Choose an option number: ").strip()
                if not selection.isdigit() or not 1 <= int(selection) <= len(options):
                    print("Choose one of the listed option numbers.", file=sys.stderr)
                    continue
                value = options[int(selection) - 1]
            elif field["input"] == "file-path":
                reader = secret_reader if field.get("sensitive") else text_reader
                value = reader("Enter local key-file path: ").strip()
                if value and not Path(value).expanduser().is_file():
                    print("That file does not exist. Try again.", file=sys.stderr)
                    continue
            elif field.get("sensitive"):
                value = secret_reader("Enter value (hidden): ")
            else:
                value = text_reader("Enter value: ").strip()
            if "\n" in value or "\r" in value:
                print("Use a file-path field for multiline material.", file=sys.stderr)
                continue
            if field["required"] and not value and field["name"] not in existing_names:
                print("A value is required.", file=sys.stderr)
                continue
            if value:
                values[field["name"]] = value
            break
    return values


def _network_is_global(network: ipaddress.IPv4Network | ipaddress.IPv6Network) -> bool:
    return network.network_address.is_global and network.broadcast_address.is_global


def parse_ip_allowlist(raw: str, accepted: set[str], allow_non_global: bool) -> list[str]:
    values: list[str] = []
    for item in (part.strip() for part in raw.split(",")):
        if not item:
            continue
        had_prefix = "/" in item
        try:
            network = ipaddress.ip_network(item, strict=False)
        except ValueError as exc:
            raise VaultError(f"invalid IP address or CIDR: {item}") from exc
        family = "ipv4" if network.version == 4 else "ipv6"
        if family not in accepted:
            raise VaultError(f"{family} addresses are not accepted by this provider profile")
        if had_prefix and "cidr" not in accepted:
            raise VaultError("CIDR ranges are not accepted by this provider profile")
        if not allow_non_global and not _network_is_global(network):
            raise VaultError(f"non-global address rejected for a public allowlist: {item}")
        canonical = str(network) if had_prefix else str(network.network_address)
        if canonical not in values:
            values.append(canonical)
    if not values:
        raise VaultError("no IP addresses were entered")
    return values


def maybe_collect_ip(profile: dict[str, Any], text_reader: Callable[[str], str] = input) -> tuple[list[str], str | None]:
    config = profile.get("ip_allowlist")
    if not config or config.get("supported") is not True:
        return [], None
    answer = text_reader("Validate trusted provider allowlist IPs now? [y/N]: ").strip().lower()
    if answer not in {"y", "yes"}:
        return [], None
    accepted = set(config.get("accepted", ["ipv4", "ipv6", "cidr"]))
    while True:
        raw = text_reader("Enter fixed public IPs/CIDRs, comma-separated: ")
        try:
            addresses = parse_ip_allowlist(raw, accepted, config.get("allow_non_global", False))
            return addresses, config.get("env_var")
        except VaultError as exc:
            print(str(exc), file=sys.stderr)


def print_plan(profile: dict[str, Any], target: Path) -> None:
    print(f"Provider: {profile['provider']}")
    print(f"Connection kind: {profile['kind']}")
    print(f"Target: {target}")
    print("Credential fields:")
    for field in profile["fields"]:
        status = "required" if field["required"] else "optional"
        print(f"  - {field['name']} ({status}, {field['input']})")
    ip_config = profile.get("ip_allowlist")
    if ip_config:
        print(f"Provider IP allowlisting: {ip_config.get('supported')}")
    if profile["official_docs"]:
        print("Official docs:")
        for url in profile["official_docs"]:
            print(f"  - {url}")
    else:
        print("Configuration source: project-local connection contract")


def existing_env_names(contents: str) -> set[str]:
    names: set[str] = set()
    for line in contents.splitlines():
        match = ENV_ASSIGNMENT.match(line)
        if match:
            names.add(match.group(2))
    return names


def configure(args: argparse.Namespace) -> int:
    profile = load_profile(args.profile.resolve(strict=True))
    root, target = resolve_target(args.project_root, args.env_file)
    print_plan(profile, target)
    if args.dry_run:
        print("Dry run complete; no prompts or writes occurred.")
        return 0
    if is_git_tracked(root, target):
        raise VaultError("refusing to write credentials because the env file is tracked by Git")

    existing = target.read_text(encoding="utf-8") if target.exists() else ""
    values = collect_values(profile, existing_names=existing_env_names(existing))
    addresses, ip_env_var = maybe_collect_ip(profile)
    if addresses and ip_env_var:
        values[ip_env_var] = ",".join(addresses)
    if not values:
        print("No environment values changed; existing values were retained.")
        if addresses:
            settings_url = profile.get("ip_allowlist", {}).get("settings_url")
            print(f"Validated {len(addresses)} trusted IP/CIDR value(s) locally.")
            if settings_url:
                print(f"Apply them in the provider console: {settings_url}")
        return 0

    ensure_gitignore(root, args.env_file)
    source = profile["official_docs"][0] if profile["official_docs"] else "project-local connection contract"
    updated = update_dotenv(existing, values, profile["provider"], source)
    hardened = _atomic_text_write(target, updated, secure=True)

    print(f"Configured {len(values)} variable(s) in {target}")
    print("Secret values were not printed and no network request was made.")
    if not hardened:
        print(
            "WARNING: Windows blocked tighter file ACLs; the env file retains the project directory's inherited permissions.",
            file=sys.stderr,
        )
    if addresses:
        settings_url = profile.get("ip_allowlist", {}).get("settings_url")
        print(f"Validated {len(addresses)} trusted IP/CIDR value(s) locally.")
        if settings_url:
            print(f"Apply them in the provider console: {settings_url}")
        else:
            print("Apply them in the provider console; local validation alone does not enforce an allowlist.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    check = subparsers.add_parser("check-profile", help="validate a nonsecret connection profile")
    check.add_argument("--profile", type=Path, required=True)

    setup = subparsers.add_parser("configure", help="prompt locally and update a root dotenv file")
    setup.add_argument("--profile", type=Path, required=True)
    setup.add_argument("--project-root", type=Path, required=True)
    setup.add_argument("--env-file", default=".env")
    setup.add_argument("--dry-run", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "check-profile":
            profile = load_profile(args.profile.resolve(strict=True))
            print(f"Valid profile for {profile['provider']} with {len(profile['fields'])} field(s).")
            return 0
        return configure(args)
    except (VaultError, OSError) as exc:
        print(f"API Vault stopped safely: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
