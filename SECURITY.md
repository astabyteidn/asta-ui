# Security

Found a security problem? Thanks for telling us. Please report it privately, not in a public issue.

## How to report

1. **GitHub (preferred).** Go to [Security → Report a vulnerability](https://github.com/astabyteidn/asta-ui/security/advisories/new). Only maintainers can see it.
2. **Email.** Write to **hello@astabyte.com** with "Security" in the subject.

Tell us:
- What the problem is, and what someone could do with it.
- How to reproduce it. Steps, a link or a small repro.
- Which version you tested (`npx asta-ui@latest --version`, or the commit).

## What happens next

- We reply within 3 working days.
- We confirm the problem and agree on a fix timeline with you.
- We ship the fix in a new release and publish an advisory.
- We credit you in the advisory, unless you'd rather stay anonymous.

Please give us a fair chance to fix it before you share it publicly.

## Supported versions

Astabyte UI is in beta. Only the latest release gets security fixes.

| Version | Fixes |
|---|---|
| Latest `0.x` | ✅ |
| Older | ❌ Update to the latest |

## In scope

- The `asta-ui` npm package: the CLI and the library.
- Components and registry files served from ui.astabyte.com.
- The agent skills in `skills/` and the MCP server at `ui.astabyte.com/mcp`.

## Out of scope

- Bugs in Radix, Base UI, React or other upstream projects. Please report those to them.
- Problems that need a compromised machine or a malicious browser extension.
- Missing security headers or best-practice notes with no real impact.
