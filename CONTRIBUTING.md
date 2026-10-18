# Contributing

Thanks for helping.

## How to start

1. Open an issue first and describe the problem before writing code. Bug reports are most useful with the library's _kb.json (without folder IDs), the request you made and the reply you got.
2. Fork the repository, make a branch, and open a pull request against main. The template lists the checks; CI runs them again.
3. The skills, shared files, tests and the inbox script are exported from the maintainer's upstream (CLAUDE.md, "Upstream and layout"). A pull request on those paths is welcome: the maintainer ports it upstream and it arrives here with the next sync.

## Rules

0. Run `git config core.hooksPath .githooks` once after cloning. Then pre-commit runs scripts/run_checks.py (unit tests, repository checks, shared copies, personal-data scan), commit-msg scans the commit message, and pre-push scans every commit about to be pushed; any of them stops a commit or push that fails.
   Claude Code sessions get the same through .claude/settings.json: the checks run once when a cloud session starts and before every git commit Claude makes, the commit scan before every git push; editing a skill's copy of a shared/ file is blocked, and editing a file under shared/ refreshes the copies.
   On GitHub, every pull request runs the checks, the personal-data scan over its commits (lines, messages, author e-mails, image and document metadata) and gitleaks over all of history, CodeQL and dependency review; Scorecard reports supply-chain practices weekly, and Dependabot keeps the actions current. Report security problems as SECURITY.md describes.
1. Edit shared files only under shared/, then run python3 scripts/sync_shared.py. CI fails when a copy is stale.
2. Keep connector tool names and sandbox paths in the backend and environment references; SKILL.md and other references use the abstract operations. scripts/check_repo.py enforces this.
3. Scripts use only the Python standard library, log to stderr in the format used by the other scripts and accept --log-level.
4. Never hard-code a library file or folder name in a script; take it from kbconf names. The inbox script takes its names from the library's inbox configuration file.
5. Changing a rule in a SKILL.md changes behaviour for every user. Explain the failure it prevents in the pull request, and add a test where a script is involved.
6. No personal data, work details or credentials, ever: run python3 scripts/sensitive_scan.py. Examples use obviously fictional names (Riverside Clinic, Project Atlas), example.com addresses and the documentation IP ranges (192.0.2.0/24). Images go in without EXIF or text metadata, documents without an author. Commit with your GitHub noreply address (Settings > Emails > Keep my email addresses private). SECURITY.md lists everything the scan covers and how to keep a private list of names it should also catch.
7. No case stories, no background. Documentation, comments, the changelog, commit messages and pull requests state rules and behaviour, not where they came from: no anecdotes, no description of the environment, organisation, people or projects something was built for, and no figures taken from real documents. Explain a rule by its reason in general terms. Where an example is truly needed, keep it minimal, fictional and de-identified (rule 6).
