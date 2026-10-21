# Troubleshooting

Symptoms, their usual causes and what to do. Setup steps are in [setup.md](setup.md). [中文](troubleshooting.zh-CN.md)

## Setup and access

| Symptom | Usual cause | What to do |
| --- | --- | --- |
| Claude answers a question about your records from general knowledge, with no file named | The knowledge base line is not in the Project instructions, was not saved, or the conversation is outside the Project | Open the Project, check the instructions hold the line init gave you, save, and start a new conversation in the Project. Then ask "which knowledge bases do I have?" |
| "No knowledge base is set up yet" although you set one up | Same as above, or `kb-libraries.json` is no longer in the Drive folder the line names | Check the line first. Then look in that folder for `kb-libraries.json`; if it was moved, move it back or say "init" and name the library folder to register it again |
| A skill does nothing, or appears greyed out | Code execution is off, or the skill is switched off | Settings > Capabilities: switch on Code execution and file creation. Customize > Skills: switch on all three skills |
| Two skills answer the same request | Both language versions of a skill are installed, or kb-incremental (1.x) is still installed next to kb-ingest | Keep one version of each skill; delete kb-incremental |
| "Google Drive must be connected" | The Drive connector is not connected, or not enabled in this conversation | Connect Google Drive and enable it for the conversation, then repeat the request |
| A permission error when writing or moving | The connected Google account cannot edit the library folder | Connect the account that owns the folder, or give that account edit rights |
| Init refuses the folder as a new library | The folder is not empty: it holds `.md` files | Use an empty folder for a new library. A folder that already holds a spec is connected as an existing library |
| Init asks whether a folder holds original files or the knowledge base | The folder you named looks like material | Original files are read where they are and never registered; the library needs its own folder |

## Filing and answers

| Symptom | Usual cause | What to do |
| --- | --- | --- |
| A file was filed but the status card did not change | Fast intake files first and updates the status card at consolidation | Say "consolidate" and review the proposed changes. Answers that rely on a file waiting for consolidation say so |
| The intake stops at a preview | Every write is previewed first | Reply "confirm" to write, or name what to change |
| A large intake is slow or stops part way | Many files mean many connector calls | Above about 30 files the preview suggests splitting the run. Material is filed in batches; say "continue intake" in the same conversation. A new conversation starts the intake again and skips files already filed |
| The wrong library was chosen | The libraries' scope sentences overlap | Name the library in the request. Make each scope a clear sentence in `kb-libraries.json` |
| Two files with the same name in the library | Drive allows several files with one name; a write was interrupted or done by hand | Say "archive old versions": it previews and moves older copies to the archive folder |
| Library files became Google Docs | The files were uploaded by hand with Drive's conversion on | Upload `.md` and `.json` files with conversion off (Drive settings: turn off converting uploads). Files the skills write are never converted |
| An answer says the library does not record something you filed | The wording differs, or the file is not filed yet | Ask with the words the document uses, or ask "is <document> filed?" to check the file index |

## Inbox

| Symptom | Usual cause | What to do |
| --- | --- | --- |
| A zip was moved to the error folder | An entry broke a rule; the note next to it names the file, the line and the rule | Fix that item and file it again. See [inbox.md](inbox.md) |
| The inbox refuses every zip from fast intake | Fast intake also delivers the consolidation queue, whose name starts with an underscore | Set `intake.mode` to `full` in the library's `_kb.json` when you use the inbox |
| Nothing happens to uploaded zips | The timer is not installed, or real runs are off | In the Apps Script editor run `showStatus()`, then `enableAutoRun()` |

Still stuck: open an [issue](../../../issues) with the request you made, the reply you got and the library's `_kb.json` without folder IDs.
