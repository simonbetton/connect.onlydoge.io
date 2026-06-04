# Contributing

Thanks for contributing to OnlyDoge DogeConnect Debugger.

## Scope

Contributions are welcome for:

- Protocol validation correctness
- Relay simulator behavior and compatibility
- UI/UX improvements for debugging workflows
- Tests, docs, and developer experience

## Local Setup

1. Install dependencies:

```bash
bun install
```

1. Start the app:

```bash
bun run dev
```

1. Run quality gates before opening a PR:

```bash
bun run check
bun run typecheck
bun run test
```

## Architecture Rules

This codebase follows a modular monolith, Hexagonal architecture, and DDD-inspired layering.

Dependency direction:

- `domain` <- `application` <- `adapters`

Contribution guardrails:

- Keep business invariants in domain value objects/entities.
- Put workflow logic in explicit use-case services.
- Keep transport logic (HTTP/UI/storage/crypto adapters) outside domain.
- Add or update tests whenever behavior changes.

## Coding Standards

- TypeScript with strict, explicit contracts
- Biome for lint/format/import organization
- Small, focused changes over broad refactors
- No unrelated drive-by edits in the same PR

## Pull Request Process

1. Open an issue first for large changes or design shifts.
2. Create a branch and keep commits scoped and readable.
3. Include a concise PR summary:
   - Problem statement
   - Approach and tradeoffs
   - Test evidence
4. Ensure OpenAPI contracts remain accurate when API behavior changes.
5. Wait for review and address feedback with follow-up commits.

## Testing Expectations

When applicable, include:

- Unit tests for domain value objects and use cases
- Integration tests for Elysia routes and error paths
- UI behavior tests for tools flow and validation output

## Commit and PR Quality Checklist

- [ ] `bun run check` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] Architecture boundaries are respected
- [ ] New behavior is covered by tests
- [ ] Docs are updated if contracts or workflows changed

## Reporting Security Issues

Please do not open public exploit issues. Report security concerns privately to the maintainers.
