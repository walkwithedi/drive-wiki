---
name: kb-ingest
description: Files Office, PDF, mail, pictures and text into an evergreen Markdown library in a Google Drive folder. Six modes. Intake - "file these", "add to the knowledge base", "intake", "continue intake", "finish intake", or uploads: files each item by the library spec (fast by default: searchable at once), large folders in batches, removes duplicates, spots new versions, updates the index. Consolidation - "consolidate": adds key conclusions to filed items, flags changed conclusions, updates the status card after review. Archive - "archive old versions", "clean up duplicates": moves old copies to the archive after a preview. Health check - "check the knowledge base", "health check": reports only. Init - "get started with the knowledge base", "first time", "set up a knowledge base", "new library", "init": sets up or connects a library Quick-note filing - "file my quick notes", "notes are filed". Use it for any filing or setup even without these words. Not for questions (kb-query) or saving one note (kb-note).
---

# Knowledge base intake, archive, health check and init

Version: 2.0.0

## Modes

- Intake: fast by default. When _kb.json intake.mode is fast (also when it is missing) and the request does not ask for a full intake ("full intake", "完整入库"), read references/fast.md after step 0: each item goes through Check 1, steps 1, 2 and 4 and is delivered at once, searchable as soon as it is written; step 3 and step 5 wait for consolidation. intake.mode full, or a request for a full intake: steps 0 to 5 below for every item.
- Consolidation: "consolidate", "整合", or the choice offered after a fast intake or by the reminder in references/config.md, section 5. After step 0, read references/consolidate.md: it writes the key conclusions of the queued files (step 3), judges the triggers (step 5) and rewrites the summary files once per round after the user reviews the changes.
- Archive: after step 0, read references/archive.md and follow it instead of the five steps.
- Health check: after step 0, read references/lint.md. Report only, change nothing.
- Quick-note filing: read references/notes.md and follow its two rounds; its intake part still uses step 0 and the intake mode of the library.
- Batch mode: intake of files or folders on disk that make more than one batch, or "continue intake" / "finish intake". After step 0 and Check 1, read references/batches.md: it plans the batches, runs steps 1 to 4 and delivery per batch (per item in fast mode), and keeps step 5 and topic expansion's spec rewrite for one final step (consolidation in fast mode).
- Init and getting started: read references/init.md and follow it (getting started looks at the environment first; the existing-library branch runs step 0 first; the new-library branch skips it).
- One request asking for intake and archive: do the intake first. With delivery = direct there is nothing to archive afterwards. With delivery = zip, wait until the user confirms the upload, then run archive mode (or let the user's inbox script do it if _kb.json has an inbox entry).

This skill holds the process. The rules live in each library's own spec. Partitions, topics, terms and thresholds are always read from the spec; never write them from memory or from this file. Differences between libraries live only in _kb.json and _kb-params.md.

Before the first step, read references/config.md and references/environment.md once.

## Step 0: choose the library (always first)

Libraries share one process. Picking the wrong one writes material into the wrong library and archives the wrong files, so decide explicitly:

1. Load the registry (references/config.md). If a library ID, label, folder ID or path is named in the request or the project instructions, use that library. No registry, or no library in it: follow references/config.md (init mode).
2. Otherwise match the material against each library's scope. If exactly one fits, propose it in one line and continue only when the user agrees or the request already made it clear; if none or several fit, ask in one sentence which library to use. Never default.
3. Read the backend file (references/backend-gdrive.md), then read _kb.json and _kb-params.md from the library root. A missing _kb.json or _kb-params.md: stop and offer init mode (existing-library branch).
4. Write the first line of the reply: Library: <label>. From here on, search and write only inside that library.
5. Unfinished intake: when a batch run of this conversation has pending batches (references/batches.md) and the request is not already "continue intake", a request with new material goes to batches.md, "A run is already open".

_kb-params.md defines: summary-file reading conditions, step 1 dates and output fields, the close-reading list, the five trigger classes and their output, the metadata header, issue categories, readme sections, the fallback partition and wording precedents, and any extra hard rules. "See params" below means that file.

## Role and hard rules

You file and judge; you do not advise, recommend or evaluate. These rules apply to every library; _kb-params.md may add more.

1. Never add a partition number. Topics come from Table A of the spec; material that fits no topic gets a new topic under "Topic expansion", without pausing.
2. Never invent rules. If the spec cannot be found, stop the whole run and ask the user to provide it.
3. Never trim content. Cleaning touches formatting only; the body keeps all its information.
4. Never infer. Where the material records no basis, write "basis not in material".
5. Never edit source text. Issues are recorded, not corrected. Exceptions are defined in params (for example masking class-A data when sensitivity is enabled).
6. The file name is the version key. A new version of the same material must have exactly the same file name as the old one; that is how older versions get archived.
7. Different material must never share a name, or one of them will be archived by mistake. When rule 6 and rule 7 cannot be told apart, take the safe side: rename to distinguish.
8. Every judgement needs evidence. If you cannot quote the source text a step asks for, take the conservative conclusion.
9. Read in full before you rewrite. Before rewriting any summary file, read the existing version completely; after rewriting, compare both with scripts/card_check.py and do not deliver until it passes. New or changed status-card items also go through the evidence check (scripts/evidence_check.py), whose findings the user sees before accepting.
10. Searches are capped. Each required file gets one search and one retry; do not keep trying new keywords.
11. Never use as a source: anything in the archive folder; names starting with an underscore or with names.snapshot_prefix; names containing names.old_suffix plus a time stamp.
12. Replies follow the library language and preferences.output (references/environment.md). YAML front matter and the Bases block in entity pages are file formats and keep their syntax.
13. No wiki links in body text. Links appear only in front matter, in the basis lines of summary files, and in entity pages.
14. Working notes stay out of knowledge files: cleaning results, term fixes, duplicate and trigger judgements appear only in the reply and the readme.
15. The library folder and the material are different things (references/config.md, section 3). Material may come from any number of folders and files anywhere, chosen anew for every intake; read it where it is, and never move or change it. Never choose or suggest a folder for the user, never offer to change a library's folder because the material is elsewhere, and name the two to the user only in the words that section gives.
16. An intake is finished only when its delivery is done: with direct delivery, round 2 ran and remote-log printed the run log (each item "ok" or its error); with zip, package.py zip built the zip and it was handed over. Until then never say the material was filed, ingested or delivered, and never give a number of files in the library: say which step the run reached (cleaned, conclusions written, preview shown and waiting for "confirm", ...), that nothing is in the library yet, and what is left. The counts in the final reply come from the run log or the zip, never from memory. In batch and fast mode this holds for each batch or item.

## Input checks

Check 1: material is readable. Handle several items one by one, never merged. Read images and scans as text first; record unreadable parts as they are and log them as issues. Keep the path of each original upload (the file itself, not a converted copy) for the hash in step 4; pasted text has no original file and step 4 runs without --file.

No material given: the user asks for intake but names no path and uploads or pastes nothing. Ask where the material is (uploads, or the folders or files with the original documents; several are fine), without suggesting a path.

Many files: when the material is files or folders on disk and commands can run, plan the batches before reading any of it (references/batches.md). One batch: go on here as usual. More than one: follow batches.md.

Conversion, before reading anything: when _kb.json convert.enabled is true (or the user asks for it in this request, and not when the user says not to convert this batch), convert the uploaded files with references/convert.md, which says which file to read for each item, when its outline is enough, and what to do with the pictures in them. Off, or without Python: read the originals as before.

Check 2: find the summary files with find_by_name using the search keys (references/config.md).
- Always read: spec, status card, file index.
- Read when the params condition holds: the others.
- When you write a summary file back, use the name found in the library; use the configured name only if none was found, and mention any mismatch in the delivery note.
- Step 4 may read up to two more files with the same name for comparison.

Check 3: from the spec take Table A (partitions, topics and type list), Table B (term fixes), Table C (open issues), Table D (thresholds) and any clause on what is in scope. If Table D is missing, use heading limit and file-name limit from python3 scripts/kbconf.py limits --language <library language>, and note "thresholds from defaults" in the delivery note.

Check 4: metadata mode. _kb.json metadata says yaml or text. Write one line: Metadata: YAML / text. In YAML mode read references/entity-yaml.md and follow it in step 1, in file output, in summary-file basis lines and for entity pages; also take Table E (entities) and Table F (value filters, if any) from the spec.

Copy whatever the scripts need into the work folder, at least the file index as <work>/<index name>. Every script runs on these copies; nothing in the library changes before delivery (index_tool.py refuses to edit an index inside a library root).

## Step 1: place the material

First apply the spec's scope clause, if there is one. Out of scope: write "Intake: out of scope" with the clause, and stop for that item.

For material in scope, set the date and fields as params require. Common fields:
- Partition, topic, type: from Table A; if no topic fits, see "Topic expansion".
- Short title: a few words naming the material, no version number. Embed what tells similar material apart: the period for recurring material, the reporting party (or family member in a life library) for one template filled by several parties, a distinguishing word for similar topics.
- Proposed file name: <partition>_<topic>_<type>_<short title>.md, no date suffix, no longer than the Table D limit (shorten the short title if needed). Spaces in topic, type and short title become hyphens in the file name (topic "Primary home" -> 05_Primary-home_...); underscores separate the four parts only. Build it with python3 scripts/meta.py name --partition <nn> --topic "<topic>" --type "<type>" --title "<short title>" --max-len <Table D file-name limit>; when it reports too long, shorten the short title and run it again.
- Document date, when params ask for the file's last-modified time: python3 scripts/meta.py date <original file> [<original file> ...] --timezone <library timezone> reads it from the document's own metadata where it has one (copying a file changes its file system time, not that) and says when only the file system time was available.

In YAML mode, map entities as entity-yaml.md says and add one line: Entities: <linked names> | New: <name or none> | Kept as text: <wording or none>.

The output format is in params. When a new topic was added, put this line before the partition line:
  Expansion: partition XX gets topic "…" (reason: one sentence)

## Topic expansion

Applies when material is in scope but no topic in Table A fits. Not for items that are out of scope, duplicate uploads, or material params say gets no file (for example mostly class-A data). Health check never expands.

1. Look again first. If a topic added earlier in this run, or a close one, fits, use it. Items of the same kind in one batch get one new topic between them, not one each.
2. Pick the partition. Never add a partition number. Choose the partition whose description is closest; if none is close, use the fallback partition from _kb.json (partitions.fallback). If no fallback is set, use the partition with the broadest scope and say in the delivery note which one you chose and that a fallback should be set. Do not pause.
3. Write the topic as a category that covers similar material, with examples in brackets if helpful, never the name of one document. Follow how Table A already words topics and the precedents in params. Append in the existing structure without changing columns: if topics are a running description per partition, append a phrase to it; if there is one row per topic, add a row after the partition's last row and fill the other columns the way the table does.
4. Rewrite the spec. Read it in full, rewrite it whole, raise the version by one minor step (v5.2 -> v5.3, v3 -> v3.1) and set the last-updated date to today. Add a revision note in the spec's existing style (precedent in params, if any): which partition, the new topic, the source file name, why that partition, and "no partition number added". If the spec has no revision notes yet, add a line "Revision:" under the version line. One delivery rewrites the spec once and raises the version once, even with several expansions or new entities. Run card_check.py on the old and new spec as in "Rewrite check", with the changed Table A rows and version line in the change list. Deliver the new spec and list it in the readme's updated-files section.
5. File the material under the new topic through steps 1 to 5.
6. Report it. The readme's change section and the delivery note list "Topics added this run (please review)": partition, new topic, source material, reason, and that the user can move it to another partition or undo it. Never expand silently.
7. Expansion changes only topic descriptions, never the partition range, so nothing else needs updating.

## Step 2: clean the body

2.1 Structural cleanup, by script, not by hand. Its output is the body file of this item, <work>/body_<n>.md (n numbers the items of this run):

  python3 scripts/clean.py <input> <work>/body_<n>.md --max-heading-len <Table D>

It drops a converter's extraction header, empty table columns, demotes over-long headings and headings ending in punctuation, and squeezes blank lines. Copy its result line into the reply. If the log shows body text removed (not just a tool header), revert that file and clean it by hand. Material under about two thousand characters that is clearly clean may be checked by eye (copy it to the body file as it is), but still give the result line in the same format. Material with no text file to clean (pasted text, a transcribed picture): write its text to the body file yourself.
Without Python: do the five actions by eye and mark the result line "manual".

2.2 Extra cleaning required by params (for example masking class-A data).

2.3 Term fixes: go through Table B one entry at a time, never with a bulk regex. python3 scripts/meta.py terms <spec> <work>/body_<n>.md lists every line holding a Table B original wording; without Python, search the body file for each entry with your search tool. Check the context of each hit to confirm it is the term; the body need not be read through for this.

Make the changes of 2.2 and 2.3 in the body file with your edit tool, one place at a time; never write the body file out again whole. Record each change: original -> fixed -> section heading. None: "Term fixes: none".

## Step 3: key conclusions

For material on the params close-reading list, read section by section and write the conclusions yourself; no automatic extraction. Tables of detail with no conclusion of their own: "This material is a detail table with no conclusions of its own." Each conclusion names its section heading; anything you cannot place is left out. Format:
  - <conclusion> (source: <section heading>)

## Step 4: duplicates and versions

The script does the mechanical checks; you make the call.

  python3 scripts/index_tool.py check <work>/<index name> --orig "<source file name>" --name "<proposed file name>" --file <source file>

It reports whether the content hash is already in the index, whether the source name is (copy numbers and paths normalised; a hit says whether that row's hash matches, differs or is missing), and whether the proposed name is. Without Python: compare names by hand and skip the hash; note "no hash check".

Duplicate upload, in this order:
- Content hash hit: identical content whatever the name; duplicate upload.
- Source-name hit marked "hash differs": same source name, changed content. Not a duplicate; a lead for a new version in the next judgement.
- Source-name hit on a row without hash: decide by name; duplicate upload. Params may ask for a content comparison (photos with camera-generated names).
For a duplicate upload, stop for that item: no file, no index row; record the fact and the evidence (hash or name) in the delivery note.

Then four fixed lines:
  Proposed file name:
  Index hit: <row printed by the script, or: no hit>
  Relation to existing: <new version of the same material / different material / not applicable>
  Version decision: <same-name new version / new material / rename to distinguish>

- Same-name new version: the file name hits, and you can state the evidence that both describe one thing (same system or body, same document series, same policy or contract, source names in version order). Keep the name, update the source name on that index row, read the change log and add to it. No evidence: rename to distinguish.
- New material: no file-name hit; add it.
- Rename to distinguish: a hit, but different content or not enough evidence. Rename by the step 1 rules, file as new, and give old name, new name and reason in the delivery note.
- Recurring material is named per period and is always new material.
- No date available and a file-name hit: always rename to distinguish.

## Step 5: triggers

The five trigger classes and their output format are in params. For each class ask three questions; it triggers only if all three are yes: does the new material contain this kind of information; does the status card have a matching entry; do they disagree. If you cannot quote the status card, it does not trigger. Day-to-day process data never triggers (examples in params).

Disposition, one line per item before the overall decision:
  Disposition: <New / Update / Disputed / No new information> (<one-line reason>)
- New: facts the status card does not hold yet. Update: the material changes a status-card item (a trigger). Disputed: the material and a status-card item disagree, but the evidence does not show which is current (similar dates, or the material is not newer than the item's basis); the item is not rewritten, and both quotes go into the delivery note (consolidation: into the change list) for the user to decide. New, Update and Disputed may combine.
- No new information: everything the material says is already in the status card or summary files, or it holds nothing the trigger classes cover. It stands alone, never triggers and is still filed (it stays searchable); list these items by name in the delivery note.

Overall decision, one of three:
- No trigger: deliver the new files and the updated index; say "No summary rewrite this run".
- Trigger: read in full and rewrite the status card and the change log (params may add others). In YAML mode, if the material links to a core entity, also update that entity page's overview (entity-yaml.md). First list the changes: "Item X: <old wording> -> <new wording>", deletions as "Delete item X: <old wording> (reason)", old wording copied exactly. Then run the rewrite check and copy its self-check lines into the reply.
- Open items only: no class triggers, but the material settles an open item or creates one. Rewrite only that list (name in params).

## Rewrite check

Compare old and new for every summary file rewritten in full (status card, change log, open items, glossary, updated entity pages, a spec rewritten for expansion or new entities). Save the old version read from the library as <work>/old_<name>, the change list as <work>/changes_<name>.txt (one change per line; empty if none), then:

  python3 scripts/card_check.py <work>/old_<name> <out>/<name> --changes <work>/changes_<name>.txt

It checks that every old item is still there or explained in the change list, that the new body is at least 70% of the old, and that entity-page type, entity type, title and aliases were not lost. A non-zero exit means fail: restore what it lists, or record the change honestly, and run it again. Never lower --min-ratio or edit the old file to pass. A large cut the user asked for: ask first, then use --min-ratio and say so in the delivery note.
Without Python: compare item by item yourself and mark the delivery note "not script-checked".

## Evidence check

Every new or changed status-card item must carry its values exactly as the basis file writes them. Before the change list is shown (consolidation) or the status card is delivered (full intake), write the new status card to <work>/draft_<card name>, copy the basis file of every new or changed item into <work>/sources/ (the new material from this run, and library files read with the backend file), then:

  python3 scripts/evidence_check.py <work>/draft_<card name> --sources <work>/sources --item <n> [--item <n> ...]

It looks up each item's dates, longer quotes and specific numbers (decimals, thousands separators, %, 万 and the like, four or more digits) in its basis files. For each line it prints: fix the wording to what the source says, or keep it when the value is derived (a sum, a converted unit) and add "(not found in the source: <value>, derived from …)" to that item's line in the change list or delivery note. "No basis link" and "basis file not in sources folder" are fixed before going on. The check is advice for the user, not a gate: a value it cannot find may still be right, and a value it finds may still be misread.
Without Python: look up each date and number of the changed items in its basis file by eye and mark the delivery note "evidence not script-checked".

## Index and lists

The file index is rewritten every run, by script:
  python3 scripts/index_tool.py add    <work>/<index name> --name <file> --orig <source name> --file <source file>
  python3 scripts/index_tool.py update <work>/<index name> --name <file> --orig <new source name> --file <source file>
  python3 scripts/index_tool.py write  <work>/<index name> --out <out>/<index name> --date YYYY-MM-DD
Pass --file whenever there is an original file; the hash goes in the third column. Without one, leave it out (update then clears the old hash, which no longer matches). Older rows without a hash are not back-filled. write sorts by name, updates the entry count and date, adds the hash column header when needed and keeps non-entry lines. Duplicate uploads, out-of-scope items and mostly class-A material get no index row.

Glossary and issue list: read and rewrite only when something is added; categories are in params. Record, never change source text.

## Failures

- Spec not found, or no Table A: stop: "The spec was not found; please add it and start again."
- Status card not found: step 5 is "cannot judge" for every class; steps 1 to 4 run; the delivery note asks the user to confirm.
- Index not found: skip the name checks, treat everything as new material, add today's date to each short title, mark each "not de-duplicated" and ask for a manual check.
- Optional file not found: do not rewrite it; a list that must be created is marked "new, from this run's material only"; a change log entry that could not be written is flagged for manual entry.
- Table B missing: skip 2.3 and say so. Table D missing: defaults, say so.
- Rename to distinguish: rename and continue. Duplicate upload: stop for that item, no index row.
- No fitting topic: expand and continue.

## Output and delivery

Each topic file starts with its metadata: YAML front matter per entity-yaml.md and the spec, or the text header from params. Then the key conclusions, then the cleaned body. New or changed basis lines in summary files are links to the source file (YAML mode).

Assemble topic files by script; never type the body out again. Write everything that comes before the body to <work>/head_<n>.md: the metadata, any section labels params put before the conclusions or the body, and the key conclusions. Then:

  python3 scripts/assemble.py <work>/head_<n>.md <work>/body_<n>.md <work>/out/<file name>

It writes the head, one blank line and the body file as it is, and refuses an existing output file, an empty body and unclosed front matter. Without Python: write the whole file yourself.

Write everything to <work>/out/. Entity pages go to <work>/out/<entities_dir>/, the only allowed subfolder. The output always holds: the new or updated topic files, the file index and the readme (names.readme); plus any rewritten summary files (including a spec rewritten for expansion or new entities) and entity pages. Never include archived files, old copies or delete lists.

Readme sections are in params. In YAML mode the change section lists new entities and updated entity pages.

Deliver by the library's delivery setting:
- zip (only when _kb.json sets it, or has an inbox entry): python3 scripts/package.py zip <work>/out <work>/<label>_intake_YYYYMMDD.zip --library <work>/_kb.json --max-name-len <Table D>, then hand over that one zip, however few files it holds. End the delivery note with: upload the zip and its files to the library root (entity pages to the entities folder, not the readme), then say "archive" to move older versions. If _kb.json has an inbox entry, say instead to upload the zip as is to the inbox folder.
- direct (the default): the two rounds in the backend file (references/backend-gdrive.md): preview, confirm, deliver. Old versions move to the archive folder in the same step, so nothing is left for the user to upload or archive.

After delivery (hard rule 16), say in a few sentences what was processed, the trigger decision and anything that needs attention; list "Topics added this run (please review)" if any. With conversion on, include its line (references/convert.md). Do not repeat the readme.

Intake only creates files. It never deletes or moves existing library files, except the archive step of direct delivery and the second round of quick-note filing, both after the user confirms. Batch mode also writes and updates its progress file (names.batch_plan) in the work folder (references/batches.md).
