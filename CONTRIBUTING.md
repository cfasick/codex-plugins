# Contributing

## Plugin update workflow

1. Make the plugin change in its versioned folder under `plugins/` or synchronize an approved personal-build change into that folder.
2. Update `.codex-plugin/plugin.json` using semantic versioning:
   - patch for compatible bug fixes or documentation corrections;
   - minor for backward-compatible features;
   - major for incompatible configuration or behavior changes.
3. Update the relevant section in `docs/index.md` when capabilities, setup, security behavior, or required environment variables change.
4. Run `python scripts/validate_repo.py`.
5. Review the staged diff for credentials and unrelated files before committing.

If Codex changes a plugin build outside this repository, it must ask whether to update the repository copy and its version before the task is considered fully handed off. It need not ask again when synchronization was already part of the user's request.

## Adding a plugin

Add source under `plugins/<plugin-name>/`, add a matching entry to `.agents/plugins/marketplace.json`, document it, and validate. The folder name, marketplace name, and `.codex-plugin/plugin.json` name must match.
