---
name: simplify
description: Review the most recent commit for duplication, unnecessary complexity, and verbose documentation. Use when the user invokes $simplify or asks for a review focused on simplifying HEAD.
---

## Task

Review only `HEAD` on the current branch for opportunities to reduce duplication, accidental complexity, and verbose docs while preserving behavior, security assumptions, trust boundaries, and operational detail.

This is a review-only pass:

- Do not edit files or apply patches automatically.
- Inspect files changed in `HEAD`, plus nearby code needed to judge duplication or simpler local patterns.
- Ignore earlier commits and unstaged/staged working-tree changes that are not part of `HEAD`.
- Report worthwhile findings and, when useful, the smallest safe patch shape.

## Repository Priorities

- Never simplify by moving outcome authority, payout decisions, wallet authority, auth checks, RPC privileges, worker-only actions, or database writes to a less trusted boundary.
- For fairness, settlement, payouts, wallet, auth, RPC, worker, or database-write paths, trace the trust boundary before recommending consolidation.
- Prefer deletion, direct codepaths, and reuse of established local helpers over new abstractions.
- Documentation should be lean, but must preserve decision rationale, security assumptions, operational steps, schema/API details, and user-visible behavior.

## Required Procedure

1. Identify review scope from `HEAD`. Run `git log -1` to get the commit title/hash, and `git show HEAD` to see the exact changes.
2. Inspect the changed files and enough surrounding code to understand the local patterns and duplication surface.
3. Search for duplicate or near-duplicate logic:
   - Repeated helpers, validators, mappers, formatters, selectors, hooks, components, query builders, error handling, constants, or copy blocks.
   - Logic that differs only by naming, small literals, type shape, route prefix, game mode, or status enum.
   - Parallel implementations across client/server, worker/API, single-player/multiplayer, or docs/source that may now drift.
4. Identify complexity that has grown beyond the problem:
   - Deep branching, boolean flag combinations, excessive intermediate variables, defensive code for impossible states, over-generalized helpers, single-use wrappers, redundant state, unnecessary effects, unnecessary memoization, or type/schema duplication.
   - React components that could be smaller by moving pure derivation out of JSX, deleting wrappers, or using existing components.
   - R3F or Three.js code that creates unnecessary allocation paths or state churn while trying to manage simple visibility or animation state.
5. Review documentation touched by `HEAD`:
   - Remove repetition, duplicated explanations, generic filler, stale implementation narrative, and verbose step descriptions.
   - Preserve exact commands, trust-boundary rules, operational recovery steps, schema/API contracts, business rules, and rationale that prevents future mistakes.
   - Prefer one authoritative explanation plus cross-links over restating the same detail in multiple docs.
6. For each simplification candidate, decide whether it is safe and worthwhile:
   - Estimate the reduction: deleted lines, deleted branches, removed files, consolidated docs, fewer concepts, or fewer maintenance paths.
   - State the behavior that must remain unchanged.
   - Reject candidates that reduce clarity, obscure security boundaries, make tests harder to reason about, or create an abstraction around one caller.
7. When a safe improvement is obvious and low risk, provide the minimal patch recommendation or apply it if this prompt is being run in edit mode.
8. If edits are made, run only the narrowest relevant check needed to validate the simplification, such as formatting for touched files, a targeted unit test, or a typecheck for the affected package. Do not run the full build/test suite by default.

## Output Format

### 1) Commit Under Review

- Commit hash:
- Commit title:
- Files reviewed:
- Nearby files inspected:

### 2) Simplification Findings

For each finding, include:

- Impact: `high` | `medium` | `low`
- File and line(s)
- Pattern: `duplicate code` | `near-duplicate logic` | `unnecessary complexity` | `verbose docs` | `stale docs` | `dead code`
- Why it can be simpler
- Minimal simplification recommendation
- Expected reduction:
- Behavior/security constraints to preserve:

If no material simplification findings exist, state: `No worthwhile simplification opportunities found in HEAD.`

### 3) Safe Edits

- Edits applied: `yes/no`
- Files changed:
- Rationale:

If edits were not applied, list the recommended patch shape instead of producing speculative code.

### 4) Documentation Review

- Documentation impact: `yes/no`
- Docs reviewed:
- Leaner docs recommended:
- Details that must be preserved:

### 5) Validation

- Command(s) run:
- Result: `pass/fail/not run`
- If not run: explain why no narrow validation command was needed.

## Review Standard

- Be strict about duplication and accidental complexity.
- Prefer deletion over extraction when the duplicated code is small and clearer inline.
- Extract only when it removes meaningful duplication without hiding important domain differences.
- Treat fewer moving parts as the goal, not fewer characters.
- Do not flatten explicit security or trust-boundary checks into clever helpers unless the resulting path is easier to audit.
- Keep recommendations concrete. Avoid generic advice such as "consider refactoring" without showing the smallest safe change.
