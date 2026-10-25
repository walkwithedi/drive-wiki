# drive-wiki

A personal knowledge base that Claude keeps current in your Google Drive. Ask it from the Claude app on your phone and get one current answer with the file it came from. Three skills for claude.ai and the Claude apps do the work; the library is a plain folder of Markdown files you own.

[中文说明](README.zh-CN.md) · For an offline library on your own computer, kept by a local model, see [evergreen-wiki](https://github.com/walkwithedi/evergreen-wiki).

## What it looks like

A question to the fictional [sample library](examples/) (reply shortened):

```text
You:    What is my cholesterol trend?
Claude: Library: Life
        Total cholesterol was 5.6 mmol/L at the 2025 annual checkup, above the
        reference of 5.2; a follow-up was suggested in 12 months. The library holds
        one checkup so far, so there is no trend yet.
        Basis: 02_Checkups_report_2025-annual.md
```

The answer comes from the library's status card, one line per current fact, each with its source:

```text
1. Annual checkup 2025: total cholesterol 5.6 mmol/L, above the reference 5.2;
   follow-up suggested in 12 months (basis: 02_Checkups_report_2025-annual)
2. Cloud storage subscription renews 2026-11-01, 99.00 per year (basis: ...)
```

File the 2026 checkup and say "consolidate": item 1 is proposed for an update, you accept it, and the 2025 report stays filed as the earlier result.

## What you get

- **The current answer, not the best match.** New versions replace old ones when material arrives, so an outdated plan or an old statement does not come back as the answer.
- **A source for every fact.** Each answer names its file; what the library does not hold is said to be not recorded, never filled in from memory.
- **Nothing lost.** Older versions move to an archive folder; nothing is deleted, and every write is shown to you first.
- **Your Drive, your phone.** The library stays in your own Drive, searched by its full text, and noting, filing and asking all work from the Claude app, with no git or commits. Why: [docs/methodology.md](docs/methodology.md#why-google-drive-and-claudeai).

| Skill | You say | It does |
| --- | --- | --- |
| kb-note | "note this", "save this answer" | keeps a remark or an answer as a quick note, filed later |
| kb-ingest | "file these", "consolidate", "health check", "get started with the knowledge base" | files material, keeps one current version of each document, updates the status card after your review, checks the library |
| kb-query | any question the library may answer | searches the library first and names the file each fact comes from |

All phrases, and what happens after each: [docs/daily-use.md](docs/daily-use.md).

## Quick start

You need a claude.ai plan with Skills, **Code execution and file creation** switched on (Settings > Capabilities), the Google Drive connector, and the web or desktop app for the first setup.

1. Download `kb-note`, `kb-query` and `kb-ingest` from [Releases](../../releases) (three zips; the `-zh` ones have Chinese trigger phrases) and upload each in Customize > Skills.
2. Create an empty Google Drive folder for the library and a Project for your knowledge base.
3. In the Project, say "get started with the knowledge base". Claude asks three questions, shows a preview, writes the library and gives you one line for the Project instructions. Paste it, save, and start a new conversation in the Project.
4. Check: ask "which knowledge bases do I have?". If Claude names your library, you are set up.

Step by step: [docs/setup.md](docs/setup.md). Something not working: [docs/troubleshooting.md](docs/troubleshooting.md).

## Is it for you

- **For** one person keeping their own knowledge, life and work, and asking it from anywhere. Notes, questions and intake all run in the Claude app on a phone. For a large intake, convert the files to Markdown first on a computer, for example with [doc2kb](https://github.com/walkwithedi/doc2kb), and consider the [inbox](docs/inbox.md).
- **No servers.** There is no git, terminal or server to set up; uploaded Word, PDF and mail files are turned into text first.
- **Not for** teams writing to one library at the same time (there is no protection against simultaneous writes), or anyone who wants line-by-line history or a fully offline library.

## How it stays current

- **Name equals version.** A new version of a document takes the old one's name; the old one moves to the archive folder.
- **One status card per library** holds the current answer to every recurring question. It is rewritten only when new material contradicts it, after you review the change, and a script checks that no line was lost and that its numbers and dates appear in the sources.
- **Evidence or no change.** Every judgement (duplicate, new version, change of fact) needs a quote; without one the skill takes the conservative choice.
- **File fast, consolidate after.** Each file is searchable as soon as it is filed; updating the status card happens when you say "consolidate".

The reasoning: [docs/methodology.md](docs/methodology.md).

Pieces: the three **skills**; one or more **libraries** (Drive folders, for example one for life and one for work); a small **registry** file in Drive listing them; **one line in the Project instructions** pointing Claude to the registry; and an optional **inbox** Apps Script that files delivered zips on its own.

Inside a library:

```text
life-kb/
  00_Spec.md               partitions and topics, term fixes, thresholds
  00_Status-Card.md        current facts, each linked to its source
  01_File-Index.md         every filed document with its source file and hash
  01_Open-Items.md         due dates and to-dos (life) or open decisions (work)
  01_Change-Log.md         how facts changed over time
  02_Checkups_report_2025-annual.md
  ...
  Entities/  Archive/  Quick-Notes/
```

Two presets start a library: life (health, money, insurance, home, family, IDs and legal, devices, subscriptions and travel, learning, reference) and work (goals and plans, projects and tasks, proposals and deliverables, meetings and decisions, policies and procedures, organisation and roles, data and reports, reference and templates). Every file name is configurable.

## Documentation

| Read | For |
| --- | --- |
| [setup](docs/setup.md) | requirements, installing, the first library, more libraries, the registry |
| [daily use](docs/daily-use.md) | what to say for each task, and what happens |
| [troubleshooting](docs/troubleshooting.md) | symptoms, causes and fixes |
| [inbox](docs/inbox.md) | the optional Apps Script that files delivered zips |
| [methodology](docs/methodology.md) | why the rules are what they are |
| [sample library](examples/) | a fictional library to try everything on |
| [changelog](CHANGELOG.md) | what changed; upgrading from 1.x is under 2.0.0 |

Each release carries the three skill zips, their `-zh` versions and a zip of the whole repository ([what to download](docs/release-downloads.md)).

Contributing, repository layout and development: [CONTRIBUTING.md](CONTRIBUTING.md). Licence: [MIT](LICENSE).
