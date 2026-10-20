# Setup

How to start a library in claude.ai or the Claude apps, what each step writes, and how to add, update or try one. [中文](setup.zh-CN.md)

## What you need

- A claude.ai account with Skills (Settings > Capabilities) and the Google Drive connector.
- A Google Drive folder for each library, empty when the library is new.
- A Project for your knowledge base. Only Project instructions persist across conversations, and the one line that tells Claude about your libraries goes there.

## 1. Upload the skills

Download `kb-note-<version>.zip`, `kb-query-<version>.zip` and `kb-ingest-<version>.zip` from the [Releases](../../../releases) page; the `-zh` zips are the same skills with Chinese trigger phrases. Upload each in Settings > Capabilities > Skills and make sure all three are switched on. To update later, upload the new zips in the same place, replacing the old ones; libraries need no change.

## 2. Set up the first library

In the Project, with Google Drive connected, say "get started with the knowledge base" ("开始使用知识库"). kb-ingest:

1. Asks three questions, one at a time: the Drive folder for the library (a link or folder ID; it must exist and be empty), the preset (life or work) and one sentence on what belongs in the library (the scope, used to route each request to the right library).
2. Works out the rest: label and id, language, timezone, sensitivity (on for life), conversion of uploads to Markdown (on).
3. Shows a preview of everything it will write. Nothing is written before you reply "confirm"; any item can be changed first.
4. Writes into the folder: `_kb.json`, `_kb-params.md`, the spec (`00_Spec.md`), the empty summary files, and the Archive, Quick-Notes and (YAML mode) Entities folders.
5. Writes the registry `kb-libraries.json` into the root of this first library.
6. Gives you one line to paste into the Project instructions:

   ```text
   I keep knowledge bases; their list and scopes are in Google Drive (registry: Google Drive folder <folder id>, file kb-libraries.json). For questions my knowledge bases may answer, use kb-query before searching code or answering from memory; to save something, use kb-note.
   ```

   In Chinese the line reads 「我有知识库，库的清单与范围在 Google Drive 里（registry: Google Drive folder <folder id>, file kb-libraries.json）。……」; the `registry: ...` part stays in English either way.

Paste the line into the Project instructions, save, and start a new conversation in the Project.

## 3. Try it

1. Upload a document and say "file this". Intake places it in a partition, names it, checks for duplicates and versions, writes it after a preview and reports one line. It is searchable at once.
2. Ask a question the document answers. kb-query reads the status card, then the file, and names the file in its answer.
3. Say "consolidate". kb-ingest adds the file's key conclusions and proposes changes to the status card as a numbered list for you to accept.

Other requests: "note this: ..." (kb-note), "file my quick notes", "archive old versions", "health check".

## Adding a library

Say "set up a new knowledge base" in the Project. The same three questions and preview follow; the new library is added to the registry in Drive (the old registry copy moves to the archive folder), so the Project instructions stay as they are.

An existing library (a folder that already holds a spec, for example the [sample library](../examples/)) is connected the same way: name its folder, and init mode reads the spec, derives `_kb.json`, offers a draft `_kb-params.md` if it is missing, and registers the folder without changing its knowledge files.

## The registry

`kb-libraries.json` is plain JSON. Init mode keeps it; you can also edit it in Drive (keep one copy in the folder named in the instructions line):

```json
{
  "schema": 1,
  "preferences": {"language": "en", "output": "markdown"},
  "libraries": [
    {"id": "life", "label": "Life", "scope": "me and my family: IDs, health, insurance, money, home",
     "backend": {"type": "gdrive", "root": "<drive-folder-id>"}},
    {"id": "work", "label": "Work", "scope": "team projects, decisions, specs, owners",
     "backend": {"type": "gdrive", "root": "<drive-folder-id>"}}
  ]
}
```

- `scope` decides which library a request goes to; keep each one a clear sentence.
- `preferences.output` is `markdown` or `plain` (no Markdown markup in replies).
- Every entry is a Google Drive folder (`"type": "gdrive"`); an entry of another type is refused.

A registry can also be built into the skill zips for your own use: `python3 scripts/build_skill.py --config my-registry.json` writes it into each zip. Such a zip holds your folder IDs: never publish it.

## Settings of a library

`_kb.json` and `_kb-params.md` sit in the library root; the skills read them every time. The keys of `_kb.json` (language, timezone, names, sensitivity, partitions, delivery, conversion, intake) are described in [skills/kb-ingest/references/config.md](../skills/kb-ingest/references/config.md). Say "init" and name the library to have init mode check them against the spec and complete them.

To deliver intake results as a zip through the Apps Script inbox instead of writing them directly, see [inbox.md](inbox.md).
