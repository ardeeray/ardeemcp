export const nodejsCliConventions = `# Node.js / TypeScript CLI Conventions

## TypeScript
- Use strict mode: \`"strict": true\` in tsconfig
- No implicit any — all types must be explicit
- Use \`NodeNext\` module resolution for ESM compatibility
- Use \`.js\` extensions in imports (required for ESM with NodeNext)

## Environment variables
- Validate ALL required env vars at startup before any logic runs
- If a required env var is missing, log a clear error message and exit with code 1
- Use a dedicated \`validateEnv()\` function called at the top of the entry point
- Never access \`process.env\` deep in business logic — read at startup and pass as config

## Error handling
- All top-level async code must have a \`.catch()\` or try/catch
- Log errors with context (what operation failed, what input caused it)
- Use exit code 1 for errors, 0 for success
- Never swallow errors silently

## Logging
- Use \`process.stderr\` for logs/errors, \`process.stdout\` for output data
- This allows CLI output to be piped without log noise

## Command structure
- Use a CLI framework (e.g. commander, yargs) for multi-command CLIs
- Each command should be a separate file in \`src/commands/\`
- Validate command arguments before executing

## Code style
- Keep entry point (\`src/index.ts\` or \`src/cli.ts\`) lean — delegate to command modules
- Avoid global mutable state
- Prefer pure functions for business logic — easier to test
`;
