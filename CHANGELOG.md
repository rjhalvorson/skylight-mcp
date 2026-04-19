# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-19

First release under maintained continuation at [rjhalvorson/skylight-mcp](https://github.com/rjhalvorson/skylight-mcp). The original project at [TheEagleByte/skylight-mcp](https://github.com/TheEagleByte/skylight-mcp) appears unmaintained; this repo carries it forward.

### Breaking Changes

- **npm package renamed** from `@eaglebyte/skylight-mcp` to `@rjhalvorson/skylight-mcp`. Users installing via npm must update their `mcp.json` / `claude_desktop_config.json` / Claude Code config accordingly.
- **Minimum Node.js version bumped to 20.0.0.** Node 18 reached EOL in April 2025 and is no longer supported. Users on Node 18 should upgrade to Node 20 LTS or newer.

### Fixed

- **Authentication**: Updated email/password authentication to match Skylight's current web OAuth flow. The server now follows the browser login sequence (`/oauth/authorize` -> `/auth/session` -> `/oauth/token`) and uses the returned bearer token for API requests. Fixes "Invalid email or password" errors caused by the previous session-based auth no longer being accepted by the Skylight API. (Originally submitted as [upstream PR #39](https://github.com/TheEagleByte/skylight-mcp/pull/39) by Andrew Ferguson; integrated here.)

### Added

- **One-click Claude Desktop install**: Release workflow now builds and attaches an `.mcpb` bundle to each GitHub Release. Users can install with a double-click or via Claude Desktop's Settings → Extensions.
- **Automated OAuth tests**: New `tests/auth.test.ts` covers the OAuth login happy path and invalid-credential handling.
- **Shared API constants module** (`src/api/constants.ts`) centralizing the Skylight API version header and related URLs.

### Changed

- Runtime MCP server version is now read from `package.json` instead of being hardcoded.
- Release workflow reordered so `.mcpb` validation and packing run before `npm publish`; a failed pack no longer leaves an orphaned npm release.
- Release workflow verifies the git tag matches `package.json` version before doing anything destructive.
- Auth-related docs and error guidance updated to reflect OAuth-based login.

### Security

- **`@modelcontextprotocol/sdk` bumped 1.11 → 1.29** (patches ReDoS vulnerability [GHSA-8r9q-7v3j-jr4g](https://github.com/advisories/GHSA-8r9q-7v3j-jr4g) and cross-client transport data leak [GHSA-345p-7cg4-v4c7](https://github.com/advisories/GHSA-345p-7cg4-v4c7); minimum declared version is now `^1.29.0`).
- **Vitest upgraded 1.6 → 4.1** (patches esbuild dev-server vulnerability [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) and transitive advisories in ajv, minimatch, flatted, brace-expansion, picomatch, path-to-regexp, qs, and hono).
- `npm audit` now reports **0 vulnerabilities** (down from 15: 7 moderate, 8 high).

## [1.1.7] - 2025-12-30

### Fixed

- **Authentication**: Fixed email/password authentication to use correct `Basic base64(userId:token)` format instead of `Bearer token`. The Skylight API requires the user ID and token to be combined and base64-encoded for Basic auth.
- **Calendar Events**: Fixed `get_calendar_events` returning no events when querying a single day. The API treats `date_max` as exclusive, so we now add 1 day to ensure events on the end date are included.

### Changed

- Added debug logging for authentication flow to help troubleshoot login issues
- Added automatic retry on 401 errors for email/password auth (attempts re-login once before failing)

## [1.1.6] - 2025-12-29

- Initial public release
