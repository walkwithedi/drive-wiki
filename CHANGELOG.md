# Changelog

Releases follow the "Version:" line of the three SKILL.md files; merging a version change to main publishes v<version> (.github/workflows/release.yml).

## 2.0.0

Upgrading from 1.x: in claude.ai Settings > Capabilities > Skills, delete kb-incremental, then upload the three 2.0 zips (kb-note, kb-query, kb-ingest). claude.ai tells skills apart by name, so kb-ingest does not replace kb-incremental; with both installed they answer the same phrases. Libraries, the registry, the inbox and the line in the Project instructions stay as they are.

Rename
- kb-incremental is now kb-ingest (skills/kb-ingest, released as kb-ingest-<version>.zip). Trigger phrases, steps, library files and the inbox behave as before. All three skills move to 2.0.0.

New
- Evidence check: kb-ingest's scripts/evidence_check.py looks up the dates, longer quotes and specific numbers of status-card items in the files they link as basis, and lists values it cannot find, items without a basis link and missing basis files. It reports and never changes a file. Consolidation runs it on new and changed items before the change list is shown, full intake before the status card is delivered, and values not found are marked in the list for the owner to decide. The health check gains item 13, a sampled check of the status card (at most 20 basis files).
- Disposition: step 5 of intake gives each item one of new, update, disputed or no new information. Disputed items leave the status card unchanged and put both quotes to the owner; items with no new information are filed and searchable but add nothing to the change list, and the delivery note lists them.
- Answer snapshots: kb-note saves an answer worth keeping ("save this answer") with its question and basis files as a quick note. Filing quick notes turns it into an answer archive of its own: no key conclusions, never evidence for the status card. kb-query names a snapshot's date when it uses one and treats the status card as current.
- kb-query searches each keyword in the ways the library may write it (the user's words, the standard term in the status card and glossary, older forms in the spec's Table B, entity aliases in Table E), up to three in one search, within the same search cap; when nothing is found it says which wordings were tried. backend-gdrive.md describes the combined search.

Changed
- An intake counts as done only when delivery has finished: with direct delivery, after round 2 and the run log printed by package.py remote-log; with zip delivery, after package.py has packed the zip and it has been handed over. Until then the skill says which step it is at and what is still missing, and never reports files as filed or counts library files. Final figures come from the run log or the zip; batch and fast intake apply this per batch and per item.
- kb-note says a note is saved only after write_new succeeded and the file is found in the quick-notes folder by name.
- kb-query: duplicated item numbers in step 4 fixed.

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
