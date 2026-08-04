---
description: Commit staged/unstaged changes following Conventional Commits, splitting into multiple commits by logical group when needed
---

Commit the current changes in this repository. Follow these rules exactly:

1. **Conventional Commits** — every commit message must follow `type(scope): summary`, using types like `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `perf`. Keep the summary in the imperative mood, no period at the end. Add a body only when the "why" isn't obvious from the diff.

2. **No co-author trailer** — never append `Co-Authored-By: Claude ...` or any AI attribution to the commit message. Commits should look like they were authored solely by the user.

3. **Split by logical group** — before committing, run `git status` and `git diff` to see everything that changed. If the changes span more than one unrelated concern (e.g. a schema change, a design-token change, and a new feature), do NOT lump them into one commit. Stage and commit each logical group separately, in a sensible order (e.g. schema/data changes before the feature that depends on them). Use judgment: files that only make sense together (a component + the util it imports for the same feature) belong in the same commit; unrelated fixes (e.g. a CSS token fix vs. a new UI drawer) get their own commits.

4. **Review before staging** — never `git add -A` blindly. Check `git status` and `git diff` for each file being staged, and flag anything that looks like a secret or unrelated in-progress work before including it.

5. Follow the repository's existing commit style (check `git log` for tone/format) and the project's git safety rules: no `--no-verify`, no force-push, no amending existing commits, always create new commits.

After committing, run `git log --oneline -n <count>` and `git status` to confirm the result, and summarize what was committed in each commit.
