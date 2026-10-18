# Working on drive-wiki

This repository is public: code, history, commit e-mails, issues, pull requests and Actions logs can be read by anyone. CONTRIBUTING.md has the general rules; these are the ones an assistant must follow on top of them.

## Keeping private data out

- Never add personal data, details of anyone's workplace (organisation, host, system, project or people names, internal paths and addresses, business figures) or credentials. Examples use obviously fictional names (Riverside Clinic, Project Atlas), example.com addresses and the documentation IP ranges.
- Write rules and behaviour, not stories: README files, skill text, code comments, the changelog, commit messages and pull request descriptions say what something does and why in general terms. No accounts of where a rule came from, what happened to whom, or the environment a tool was built for, and no figures taken from real documents.
- scripts/sensitive_scan.py runs before every commit and push (.claude/hooks/pre_commit.py, .githooks) and in CI. When it blocks a commit or push, stop and report the findings to the user. Do not reword, delete or move the text to get past the check, and do not add the marker sensitive-scan: ignore unless the user confirms the line is harmless and agrees to the marker. Private-term findings cannot be allowed with the marker.
- When you notice something that looks private but the scan did not catch (a name, a system, a figure), report it to the user before doing anything else with it.
- The private-terms list (SENSITIVE_TERMS secret, ~/.config/drive-wiki/sensitive_terms.txt) never enters the repository, and its terms are never quoted in commits, issues or pull requests.

## Upstream and layout

- skills/, shared/, locales/, tests/, scripts/build_skill.py, scripts/sync_shared.py, scripts/deploy_apps_script.sh and apps-script/kb_inbox.gs are exported from the maintainer's upstream; EXPORTED_FROM records the source commit. A sync overwrites them, so a change to these paths is made upstream and arrives with the next sync; a pull request that changes them here is ported upstream by the maintainer, then closed or superseded by the sync.
- Everything else (README files, docs, the changelog, scripts/check_repo.py, scripts/run_checks.py, scripts/sensitive_scan.py, .claude/, .githooks/, .github/) is maintained here.
- Skill text is English; the Chinese trigger phrases come from locales/zh/descriptions.json when a zip is built. Shared files are edited only under shared/ and copied with python3 scripts/sync_shared.py.
- Run python3 scripts/run_checks.py before committing.

## Design before code

- Any task that changes files or has side effects (commits, pushes, pull requests, remote settings) starts with a design: the goal, the files to change, the approach and trade-offs considered, and how the result will be verified. A small change needs only a few lines.
- The user approves the design before any code is written: through the plan-mode approval when the session is in plan mode, otherwise by asking with AskUserQuestion.
- If the work needs to depart from the approved design (wider scope, a different approach), stop and ask again instead of widening the change.
- Questions and read-only investigation need no design.
- .claude/settings.json sets permissions.defaultMode to plan, so sessions start in plan mode and cannot edit files until a design is approved.
- Sessions started in another mode (auto, for example) are held to the same rule: .claude/hooks/plan_gate.py refuses file edits, Bash commands with side effects (git writes, removing or changing files, redirecting output into files, package installs, gh and curl writes; anything unclear counts as a change) and GitHub write tools until the session's design is approved. Reads and writes to the system temporary directory pass. Approval is an accepted plan-mode exit, or an AskUserQuestion answer that starts with "Approve plan" (or "批准方案"), so the approving option of a design question must start that way. The approval mark lives per session under ~/.claude/plan-approved/, outside the repository; never create or change it yourself. When the gate blocks something harmless, report it to the user instead of working around it.
