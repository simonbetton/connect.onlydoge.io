## Summary

Describe what this PR changes and why.

## Related Issues

- Closes #
- Related #

## Type of Change

- [ ] Bug fix
- [ ] Feature
- [ ] Refactor
- [ ] Docs
- [ ] Test-only
- [ ] Chore

## Architecture Notes

Explain how this respects module boundaries and layering:

- Domain changes:
- Application/use-case changes:
- Adapter/transport changes:

## API and Contract Impact

- [ ] No API changes
- [ ] API behavior changed
- [ ] OpenAPI schema changed

If changed, summarize endpoint/schema impacts.

## Test Evidence

Paste command results or summaries:

```bash
bun run check
bun run typecheck
bun run test
```

Additional tests run:

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] UI tests added/updated

## Screenshots or Payload Examples

Include UI screenshots, sample requests/responses, or validation outputs if helpful.

## Checklist

- [ ] I have scoped this PR to a single concern.
- [ ] I updated docs where needed.
- [ ] I added/updated tests for changed behavior.
- [ ] I preserved `domain <- application <- adapters` dependency direction.
