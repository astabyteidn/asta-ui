## What this changes

<!-- One or two sentences. Link the issue: "Closes #123". -->

## Screenshots

<!-- Before and after, or a short clip. Skip it if nothing visual changed. -->

## Checklist

- [ ] One change in this PR.
- [ ] The checks pass: `bunx tsc --noEmit && bun run lint && bun run skill && bun run base --check && bun run perf && bun run build`
- [ ] Tokens only, no hard-coded colours.
- [ ] Motion uses `transform` and `opacity`, and respects reduced motion.
- [ ] Loops pause offscreen, and everything is cleaned up on unmount.
- [ ] Colour is not the only signal, and forms follow the rules in CONTRIBUTING.md.
- [ ] Checked with the keyboard only and with reduced motion on.
- [ ] Looks right at phone width.
- [ ] Demo content uses Astabyte and fake data.
