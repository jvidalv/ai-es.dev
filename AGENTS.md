<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Package management:** Use Bun for installs and workspace scripts. Vite+ remains the build/lint/test toolchain and requires Node 24; no global vp install is needed.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vp test` command, run it using `bun run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `bun install --frozen-lockfile` after pulling remote changes and before getting started.
- [ ] Run `bun run check` and `bun run test` to validate changes.

<!--VITE PLUS END-->

## Workspace layout

- `apps/web` owns the React app, static server and website build scripts.
- `packages/content` owns Markdown posts, publication validation and shared content types. Import its explicit package exports; do not reach into sibling workspaces with relative paths.
- Root scripts enforce rules across all workspaces. Keep one Bun lockfile and the Railway Docker build context at the root.

## ai-es rules

- Read `docs/writing-style.md` before writing UI copy, articles, descriptions or metadata. It is an instruction for agents, not just an editorial reference. Use plain Spanish for a Spanish-speaking community of equals, no marketing slogans. Read `CLAUDE.md` for the community identity and working context.
- All source filenames use kebab-case (`app.tsx`, `youtube-embed.tsx`). Component identifiers remain PascalCase.
- No re-exports. Static imports are a single block at the top. Relative imports in Vite's config dependency graph include `.ts`/`.tsx`.
- Strict TypeScript: no `any`, casts, non-null assertions or type/lint suppression. Validate untrusted Markdown metadata at the boundary. This static site uses Zod, not Berrus's Elysia-specific TypeBox stack.
- Functions with more than two parameters take a typed options object.
- Keep comments to one or two lines, only for non-obvious reasons or invariants. Tests must catch a named regression rather than pinning authored text or counts.
- Reuse the `apps/web/src/lib/social-art.ts` Canvas painter registry for social icons. Match the supplied illustrations' flat palette and thick outlines. Respect reduced motion for animation.
- Content lives in `packages/content/posts`; every published page must be pre-rendered. Drafts and future posts must never enter HTML, RSS, sitemap, Markdown exports or LLM feeds. A future post needs a new build on or after its date.
- Keep public URLs and community links in `apps/web/src/lib/site.ts`. Do not invent activity, member counts, endorsements, news or affiliations.
- Preserve native text selection, image controls and browser menus. This is a reading site, not Berrus's game surface.
- Keep technical publishing and deployment instructions in README. Keep editorial voice in `docs/writing-style.md`; update them alongside behavior changes.
- Never run `git stash`, `git stash pop`, `git stash drop`, `git checkout -- .`, `git restore .`, `git reset --hard` or `git clean -fd`. Never force push without explicit per-push approval. Never apply database migrations autonomously. Do not bulk autofix unrelated files.
- Use LSP/TypeScript language-service references for navigation and before signature changes. Check diagnostics after code changes.
- Pre-commit and pre-push hooks check only; never autofix or stage files. Fix and stage explicitly. `bun run hooks:install` installs local hooks.
- Before completing non-trivial work invoke `/code-review high --fix`, then `/post-work-review` using the actual Skill tool, and fix findings. Do not substitute a self-review. If the environment cannot invoke a skill, report that limitation.
- Run `bun run check:push-gates`, `bun run build`, and browser checks for changed interactions. Railway deploys main via its GitHub source connection. Verify explicitly requested deployments; do not modify unrelated services.
