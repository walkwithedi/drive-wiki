# drive-wiki

A personal knowledge base that Claude keeps in a Google Drive folder and that stays current: every recurring question has one current answer, each answer names the file it comes from, and nothing is ever deleted. Three skills for claude.ai and the Claude apps do the work, and an optional Apps Script inbox files delivered results in Drive on its own.

| Skill | You say | It does |
| --- | --- | --- |
| kb-note | "note this", "save this answer" | saves a piece of the conversation, or an answer worth keeping, as a quick note to be filed later |
| kb-ingest | "file these", "consolidate", "file my quick notes", "archive old versions", "health check", "set up a knowledge base" | sorts material into partitions, removes duplicates, keeps one current version per document, updates the status card when facts change, checks the library's health, including whether the status card's numbers and dates appear in their sources |
| kb-query | any question the library may answer | searches the library first and answers with the file it came from, never from memory |

[中文说明](README.zh-CN.md)

## Who it is for

One person keeping their own knowledge, life and work, and asking it from the Claude app on a phone wherever they are.

- **No computer needed day to day.** Notes, questions and intake all run in the Claude app on a phone. For a large intake, convert the files to Markdown first with any tool and turn on the [inbox](docs/inbox.md); then intake runs smoothly on a phone too. One Markdown file per document keeps each document's versions and duplicate checks separate; one file for the whole batch also works and is filed as one item.
- **Current and sourced.** Newer versions replace older ones and the status card keeps only what is current: with full intake (`intake.mode: full`) each file updates it as it is filed, with fast intake (the preset) at consolidation. Every fact names its source file, and status-card changes are checked against the source before they are written.
- **Plain Drive folders.** There is no git, terminal or server to set up; uploaded Word, PDF and mail files are turned into text first.
- **Not for** teams writing to one library at the same time (there is no protection against simultaneous writes), or anyone who wants line-by-line history and fully offline libraries; a local Markdown folder kept in git suits that better.

## Why

An assistant that answers from a pile of documents returns whichever matches best, even an outdated plan. drive-wiki does the reconciling once, when material arrives, and keeps the result as plain Markdown files in your Drive:

- **Name equals version.** A new version of a document takes the old one's name; the old one moves to the archive folder. Nothing is ever deleted.
- **One status card per library** holds the current answer to every recurring question, each line linked to its source. It is rewritten only when new material contradicts it, and a script checks that no line was lost.
- **Evidence or no change.** Every judgement (duplicate, new version, change of fact) needs a quote; without one the skill takes the conservative choice.
- **The library's own spec** decides partitions and topics. It grows when material does not fit, and tells you each time.
- **File fast, consolidate after.** Each file is searchable as soon as it is filed; reconciling it with the summary files happens in a later round that you review.

The reasoning is in [docs/methodology.md](docs/methodology.md).

## How it fits together

- **The skills** (kb-note, kb-query, kb-ingest): instructions and scripts claude.ai loads. They do the work.
- **A library**: a Drive folder of Markdown files with its settings (`_kb.json`), process parameters (`_kb-params.md`), spec, status card and file index. You can keep several, for example one for life and one for work.
- **The registry** (`kb-libraries.json`, kept in Drive): the list of your libraries with each one's id, label, scope and folder ID. The skills read it to choose the library for a request.
- **One line in the Project instructions.** It tells Claude that the libraries exist and where the registry is, so it consults them before answering from memory.
- **The inbox** (optional, [docs/inbox.md](docs/inbox.md)): an Apps Script in your Google account that unpacks the zip an intake delivers, archives older versions and mails you the result.

```text
you --ask--> Claude (in a Project) --reads--> instructions line (registry: Drive folder ...)
                 |
                 +-- skill (kb-query, kb-note, kb-ingest)
                       +-- registry kb-libraries.json: which library, which folder
                       +-- library folder: Markdown files, status card, file index
                 |
                 +-- (zip delivery) --> inbox folder --> Apps Script --> library folder
```

## Quick start

1. Download `kb-note`, `kb-query` and `kb-ingest` from [Releases](../../releases) (the `-zh` zips have Chinese trigger phrases) and upload each in claude.ai Settings > Capabilities > Skills.
2. Connect Google Drive, create an empty folder for the library, and create a Project for your knowledge base.
3. In the Project, say "get started with the knowledge base". Claude asks three questions (where, which preset, what belongs in it), shows a preview, writes the library into the folder and gives you one line to paste into the Project instructions. Paste it, save, and start a new conversation in the Project.

Step by step, with what each step writes: [docs/setup.md](docs/setup.md). The fictional [sample library](examples/) shows what a library looks like after a few intakes.

## Upgrading from 1.x

In 2.0 the intake skill is named kb-ingest; it was kb-incremental. claude.ai tells skills apart by name, so uploading kb-ingest adds a second skill instead of replacing the old one, and the two would answer the same phrases.

1. In claude.ai Settings > Capabilities > Skills, delete kb-incremental.
2. Upload the three 2.0 zips: kb-note, kb-query and kb-ingest.

Libraries, the registry, the inbox and the line in the Project instructions stay as they are.

## How a library looks

```text
life-kb/
  _kb.json                 settings: language, timezone, names, sensitivity, conversion
  _kb-params.md            process parameters: what to close-read, what counts as a change
  00_Spec.md               partitions and topics, term fixes, thresholds, entities
  00_Status-Card.md        current facts, each linked to its source
  01_File-Index.md         every filed document with its source file and hash
  01_Open-Items.md         due dates and to-dos (life) or open decisions (work)
  01_Change-Log.md         how facts changed over time
  01_Glossary-Issues.md    term fixes, masking log, open issues
  02_Checkups_report_2026-annual.md
  ...
  Entities/                one page per person, organisation or system
  Archive/                 older versions and run logs
  Quick-Notes/             notes waiting to be filed
```

Every name is configurable in `_kb.json`, so a library in another language keeps its own file names. Two presets start a library: life (health, money, insurance, home, family, IDs and legal, devices, subscriptions and travel, learning, reference) and work (goals and plans, projects and tasks, proposals and deliverables, meetings and decisions, policies and procedures, organisation and roles, data and reports, reference and templates).

## Downloads

Every release carries:

| File | Use it for |
| --- | --- |
| `kb-note-<version>.zip`, `kb-query-<version>.zip`, `kb-ingest-<version>.zip` | uploading the skills to claude.ai or the Claude apps |
| the same names ending in `-zh.zip` | the same skills with Chinese trigger phrases |
| `drive-wiki-v<version>.zip` | the whole repository: skills, the inbox script, the docs and the sample library |

## Repository layout

| Path | Content |
| --- | --- |
| `skills/` | the three skills; `shared/` holds the files every skill carries a copy of |
| `locales/zh/` | Chinese trigger phrases, swapped in when a zip is built |
| `apps-script/kb_inbox.gs` | the inbox script; `scripts/deploy_apps_script.sh` pushes it with clasp |
| `docs/` | method, setup and inbox |
| `examples/` | the sample library and inbox configurations |
| `tests/`, `scripts/` | script tests, zip builder, repository checks, personal-data scan |

## Development

```bash
git config core.hooksPath .githooks       # once per clone: run every check before each commit
python3 scripts/run_checks.py             # tests, repository checks, shared copies, personal-data scan
python3 scripts/build_skill.py            # build the zips into dist/ (--locale zh for Chinese)
```

The skills, shared files, tests and the inbox script are synced from the maintainer's upstream; see [CONTRIBUTING.md](CONTRIBUTING.md). Licence: [MIT](LICENSE).
