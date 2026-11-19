# Contributing

Thanks for helping out. This page tells you how to get set up, what we look for in a PR, and how to get it merged.

**TL;DR**

1. Open an issue first for anything bigger than a small fix.
2. Fork, branch, make your change.
3. Run the checks below. They must pass.
4. Open a PR. One change per PR.

## Ways to help

- **Report a bug.** Use the [bug report](https://github.com/astabyteidn/asta-ui/issues/new?template=bug_report.yml) form. A link to a repro helps a lot.
- **Ask for a component.** Use the [feature request](https://github.com/astabyteidn/asta-ui/issues/new?template=feature_request.yml) form. Tell us the real product case it's for.
- **Fix something.** Issues labelled `good first issue` are a good start.
- **Improve the docs.** Typos and unclear sentences count.

Found a security problem? Don't open an issue. Read [SECURITY.md](SECURITY.md).

## Set up

You need [Bun](https://bun.sh) and Node 20 or newer.

```sh
git clone https://github.com/<you>/asta-ui
cd asta-ui
bun install
bun run dev    # http://localhost:3792
```

## Where things live

| What | Where |
|---|---|
| Kit components | `components/kit/<slug>.tsx`, metadata in `lib/kit.ts` |
| Kit demos | `components/kit/demos/<slug>.tsx`, listed in `components/kit/demos.ts` |
| Base UI builds | `components/kit/base/` |
| Motion lab | `components/lab/blocks/`, listed in `components/lab/components.ts`, metadata in `lib/lab.ts` |
| Catalogue (sidebar, search, registry) | `lib/ui-catalog.ts` |
| Docs pages | `app/(docs)/` |
| npm package and CLI | `packages/asta-ui/` |
| Agent skills | `skills/` |
| HTML + CSS layer | `packages/asta-ui/css/`: classes in `css/src/`, runtime JS and state CSS in `css/runtime/`, examples in `css/examples/` |

[CLAUDE.md](CLAUDE.md) has the full map. It's written for AI agents, but it reads fine for people too.

## The rules

These keep the kit consistent. A PR that breaks them will get a change request.

**Colour.** Use tokens only: `paper`, `ink`, `mute`, `signal`, `brand`. No hard-coded colours. One accent, blue.

**Motion.** Animate `transform` and `opacity` only. Use one easing, `cubic-bezier(.16,1,.3,1)`, or a spring. Respect `prefers-reduced-motion`. Put keyframes in `<style href="asta-<name>" precedence="asta">`.

**Performance.** It has to stay smooth on a mid-range phone.
- Loops pause when offscreen or when the tab is hidden, and stop on unmount.
- Clean up every listener, observer and interval.
- No layout reads inside a frame callback.
- No new runtime dependencies for a component.
- Budgets: 28 KB for a component file, 14 KB for a demo.

**Shape.** Slight rounding. Buttons 6–9px, cards 10–14px. Pills only for switches, avatars and dots.

**Content.** Demo brands are always Astabyte. Use fake data. Never show real companies, people or crypto projects.

**Copy.** Short sentences, one idea each. Lead with what the reader does. No semicolons.

## Generated files

Some files are generated. Don't edit them by hand, and don't forget to regenerate.

| You changed | Run |
|---|---|
| Added, renamed or re-described a component | `bun run skill` |
| A Radix component that has a Base UI twin | `bun run base` |
| A file in `packages/asta-ui/css/src/` or `css/runtime/` | `bun run css` |

CI fails if a generated file is stale.

## Before you push

```sh
bunx tsc --noEmit && bun run lint && bun run skill && bun run base --check && bun run perf && bun run build
```

Changed the HTML + CSS layer? Also run:

```sh
bun run css --check
```

`bun run perf` prints warnings too. Errors fail the build. Warnings are for review, but don't add new ones without a reason. Mark a deliberate layout transition with a `perf-ok` comment.

## Commits and PRs

Commit messages use [Conventional Commits](https://www.conventionalcommits.org). English, one line.

```
feat: add date range picker
fix: stop price chart loop when offscreen
docs: explain the --base flag
```

Use `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `chore` or `ci`.

For the PR:
- Keep it to one change.
- Fill in the template.
- Add a screenshot or a short clip for anything visual.
- Check it at phone width too.

`main` is protected. CI has to pass, and we squash merge. A maintainer will review, usually within a few days.

## Releases

Maintainers handle releases. Merging to `main` doesn't deploy. A version tag does, and it also creates a [GitHub Release](https://github.com/astabyteidn/asta-ui/releases) with the notes from [CHANGELOG.md](CHANGELOG.md). You don't need to edit the changelog. We write it when we release.

## License

By contributing, you agree your work is released under the [MIT License](LICENSE).

## Be kind

Everyone here follows our [Code of Conduct](CODE_OF_CONDUCT.md).
