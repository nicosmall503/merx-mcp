# Contributing

Contributions to merx are welcome. This document describes the code style, testing
requirements, and process for submitting changes.

---

## Getting started

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make your changes following the style guide below.
4. Run tests.
5. Submit a pull request.

---

## Code style

### General rules

- **Language:** TypeScript for all Node.js services. Go for the matching engine.
- **Max 200 lines per file.** If a file grows beyond 200 lines, split it into
  multiple files with clear single responsibilities.
- **Max 30 lines per function.** Break complex logic into smaller functions with
  descriptive names.
- **One file = one responsibility.** Do not mix concerns within a single file.
- **No emoji.** Not in code, not in comments, not in commit messages, not in UI
  text. This rule is enforced in review.

### Naming

- Files: `kebab-case.ts` (e.g., `price-monitor.ts`, `order-executor.ts`).
- Classes and types: `PascalCase` (e.g., `EnergyOrder`, `ProviderConfig`).
- Functions and variables: `camelCase` (e.g., `getBalance`, `orderCount`).
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `SUN_PER_TRX`).

### Financial code

- All TRON amounts in SUN internally (1 TRX = 1,000,000 SUN).
- Every balance mutation creates a paired ledger entry.
- Never delete or update ledger records. Append new entries with updated status.
- Always check balance before deducting with `SELECT FOR UPDATE`.
- If uncertain about financial logic, open a discussion issue before implementing.

### Security

- No hardcoded secrets. All configuration through `.env`.
- All inputs validated with Zod schemas.
- SQL only through parameterized queries. No string concatenation in queries.
- Never commit `.env`, private keys, or credential files.

### Services

- Services communicate via Redis pub/sub or REST API. No direct imports between
  services.
- New energy provider = one new file in `providers/`. The provider interface
  (`IEnergyProvider`) defines the contract.

---

## Testing

- Write tests for new tools and API endpoints.
- Test TRON operations on Shasta testnet (`TRON_NETWORK=shasta`) before mainnet.
- Include both success and error cases.
- Financial operations require tests that verify ledger entry creation.

---

## Pull request process

1. Keep PRs focused. One feature or fix per PR.
2. Write a clear description of what changed and why.
3. Reference any related issues.
4. Ensure all existing tests pass.
5. Add tests for new functionality.
6. A maintainer will review and provide feedback.

---

## Issue templates

### Bug report

```
**Description:** Clear description of the bug.
**Steps to reproduce:** Numbered list of steps.
**Expected behavior:** What should happen.
**Actual behavior:** What happens instead.
**Environment:** OS, Node.js version, transport mode (stdio/SSE).
**Logs:** Relevant error output (redact any keys or addresses).
```

### Feature request

```
**Description:** What you want to add or change.
**Use case:** Why this is needed.
**Proposed approach:** How you would implement it (optional).
```

---

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
