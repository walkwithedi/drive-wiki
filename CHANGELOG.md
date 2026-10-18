# Changelog

Releases follow the "Version:" line of the three SKILL.md files; merging a version change to main publishes v<version> (.github/workflows/release.yml).

## 1.23.0

First public release. Three skills for claude.ai and the Claude apps that keep a personal knowledge base in Google Drive, an Apps Script inbox, and the method behind them.

Skills
- kb-note saves a remark from the conversation as a quick note in the library's quick-notes folder; kb-query answers from the library first, naming the file each fact comes from; kb-incremental files material (fast intake, then consolidation), large folders in batches, quick notes, archives older versions, checks the library's health and sets libraries up.
- Libraries are Google Drive folders only. A registry entry of another type is refused; local folders are served by evergreen-wiki.
- A batch intake keeps its progress in the work folder for one conversation. Filing the same material again in a new conversation skips what was filed, by content hash.
- Uploads (Office, PDF, mail) are converted to Markdown before they are read. Two presets, life and work; English and Chinese trigger phrases.

Inbox
- apps-script/kb_inbox.gs unpacks delivered zips, archives older versions, refuses a zip with any entry that breaks a rule, writes a log and mails a summary. Its configuration file takes English or Chinese keys; folder and log names, the old-version suffix and the snapshot prefix are configurable. Times use the Apps Script project's time zone.
- scripts/deploy_apps_script.sh and the apps-script-deploy workflow push it with clasp.

Documentation
- docs/methodology, docs/setup and docs/inbox in English and Chinese; a fictional sample library and two inbox configurations in examples/.
