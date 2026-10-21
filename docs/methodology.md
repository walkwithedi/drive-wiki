# Methodology

Why the skills work the way they do: every rule below exists because a looser one lets answers go stale or facts get lost. The exact procedures are in the skills. [中文](methodology.zh-CN.md)

## The problem

An assistant can answer from your documents, but raw documents disagree with each other: an old plan, a newer decision, a meeting that changed it again. Searching them at question time returns whichever matches best, not whichever is current. The fix is to do the reconciling once, when material arrives, and keep the result: a library the assistant maintains, rather than retrieval over a pile.

## Four layers

1. Source documents, cleaned but never shortened, one file each, named `<partition>_<topic>_<type>_<short title>.md`.
2. Summary files: the status card (what is true now), the change log (how it changed), open items, the glossary. These answer most questions without opening a source document.
3. Entity pages: one per person, organisation, system or project, linked from every document that mentions it.
4. The spec: the library's own rules (partitions, topics, term fixes, thresholds, entities). The skills hold the process; the spec holds the rules, and grows with the library.

## Rules that keep it evergreen

- **Name equals version.** Documents carry no date in their name, so the next version of the same document lands on the same name and the previous one is archived. Two different documents must never share a name; when unsure, rename. This single rule removes most "which version is current?" questions.
- **Evidence or the conservative choice.** Duplicate, new version or change of fact: each call needs a quote. No quote, no change. A file's content hash is recorded in the index, so the same file filed twice is recognised whatever its name.
- **Three questions before touching the status card.** Does the new material carry this kind of fact; does the card have an entry for it; do they disagree. Only three yeses trigger a rewrite. Rolling process data (daily progress, single purchases) never does.
- **Rewrites are checked by a script.** The old card and the new card are compared item by item; every missing item must be explained in a change list, and the new card may not shrink below 70% without the owner's consent.
- **Values are checked against their sources.** Before a status-card change is shown for review, a script looks up its dates, longer quotes and specific numbers in the basis files; any value it cannot find is marked for the owner to decide, since a derived value may still be right. The health check runs the same look-up over the card.
- **Every item gets a disposition.** New, update, disputed or no new information. Disputed material leaves the status card unchanged and puts both quotes to the owner; material with no new information is still filed and searchable, but adds nothing to the change list.
- **Never delete, never edit sources.** Older versions move to the archive with a time stamp; issues are recorded, not silently fixed. Personal identifiers are the one exception: masked before anything is written.
- **No silent growth.** When material fits no topic, the skill adds a topic to the closest partition (never a new partition), rewrites the spec with a revision note, and lists the change for review.
- **File fast, consolidate after.** Writing an item into the library and reconciling it with the summary files are separate steps. Filing is mechanical and happens per item, so material is searchable as soon as it arrives; reconciling needs close reading and the owner's review, so it happens in rounds over many filed items, from a queue kept in the library. Until an item is consolidated, answers that rely on it say so.
- **Search caps and fixed reading order.** The assistant reads the status card first, then the specific list, then sources, and stops after a fixed number of searches. A keyword is searched in the ways the library may write it (the user's words, the standard term, older forms, aliases), up to three at once. Answers name their basis file; what the library does not record is said to be not recorded.
- **The owner decides what changes.** Every write is preceded by a preview, and nothing outside the library folder is touched.

## Quick notes

Not everything worth keeping arrives as a document. kb-note saves a remark from the conversation as a small file in the library's quick-notes folder: the words, the key points and the context, nothing else changed. Notes are searchable at once (marked "quick note, not yet filed" in answers) and are filed later in batches, grouped by partition and topic, with the notes' own words as the evidence. A note marked unconfirmed never changes the status card.

An answer worth keeping ("save this answer") is saved the same way, as a snapshot of the question and the answer with its basis files. It is filed as an answer archive: searchable, dated, never used as evidence for the status card, since its basis is the library itself.

## Sensitive data

A library can turn on sensitivity classes (`_kb.json` `sensitivity`; on in the life preset). Identifiers such as ID, card and account numbers and passwords are masked to their last few characters before anything is written or shown; health and money facts are recorded as they are and never interpreted, so answers report what is recorded and give no advice.

## Why Google Drive and claude.ai

- **Plain files you own.** A library is a folder of Markdown files in your own Drive: readable without the skills, searchable by Drive, openable in any editor (with Google Drive for desktop, as an Obsidian vault).
- **Nothing to install.** The skills run in claude.ai and the Claude apps, on the web and on the phone. Scripts run in Claude's own sandbox and use only the Python standard library; without it, the skills do the same work by hand and say so.
- **The registry lives with the libraries.** The list of libraries is a file in Drive, named once in the Project instructions; adding a library later changes only that file.
- **Search stays inside the library.** Every Drive search is limited to the library folder by its ID, one level deep, so the archive and unrelated files never enter an answer.

## Delivery: direct or through the inbox

Drive allows several files with one name, so a new version must be written only after the old one has moved to the archive folder.

- **Direct (the default).** After you confirm a preview, Claude writes each file through the Drive connector, moving the old version to the archive in the same step. Simple, and right for most libraries.
- **Zip and the inbox.** Intake packs its results into one zip; you upload it to the library's inbox folder as is, and the Apps Script inbox unpacks it, archives older versions, refuses the whole zip when one entry breaks a rule (a file name outside the partitions, a missing front matter, an unmasked identifier), and mails you the result. Useful when many files are delivered at once, when the connector cannot write, or when you want a second check between the assistant and the library. Set up: [inbox.md](inbox.md).

## What the presets give you

Two starting points, both editable during setup: a work library (goals and plans, projects and tasks, proposals and deliverables, meetings and decisions, policies and procedures, organisation and roles, data and reports, reference and templates) and a life library (health, money, insurance, home, family, IDs and legal, devices, subscriptions and travel, learning, reference). The life preset includes sensitivity classes.
