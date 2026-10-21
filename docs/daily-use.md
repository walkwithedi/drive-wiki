# Daily use

What to say for each task, what happens next, and what waits for your reply. The skills pick the library from the request; name it ("in Work: ...") when more than one could fit. [中文](daily-use.zh-CN.md)

## What to say

| You want to | Say | What happens | Waits for you |
| --- | --- | --- | --- |
| Ask something | just ask | kb-query reads the status card, then the files it needs, and names the file behind each fact | no |
| Keep a remark | "note this: ..." | kb-note saves it as a quick note in the library's quick-notes folder and replies with the file name | no |
| Keep an answer | "save this answer" | the question, the answer and its basis files become a quick note | no |
| File documents | upload or name them, then "file these" | each item is placed in a partition, named, checked for duplicates and versions, and written; searchable at once | a preview at the start of the run: reply "confirm" |
| Continue a large intake | "continue intake", "finish intake" | the next batch of the plan made at the start; only within the same conversation | the batch preview |
| Bring the status card up to date | "consolidate" | key conclusions for the files filed since the last round, and proposed status-card changes as a numbered list, each value checked against its source | you accept or reject each change |
| File quick notes | "file my quick notes" | notes are grouped into material and filed; then the filed notes move to the filed folder | a preview, then "confirm" for the move |
| Tidy older copies | "archive old versions", "clean up duplicates" | older copies with the same name move to the archive folder | a preview |
| Check the library | "health check" | a report of stale, duplicate, missing and badly formatted items, and a sample check of the status card | no; it changes nothing |
| Add a library | "set up a new knowledge base" | three questions, then the new library is written and registered | a preview |

Add "full intake" to a filing request to update the status card for each file as it is filed, instead of waiting for consolidation.

## The life of a document

```text
upload --"file these"--> filed: named, indexed, searchable at once
                           |
                           +--"consolidate"--> key conclusions written,
                                               status card change proposed --you accept--> status card updated
                           |
next version, same name --> filed under the same name; the old copy moves to Archive/
```

Until a file is consolidated, the status card may not reflect it. Answers that rely on such a file say so, and the skills remind you once per conversation when files are waiting.

## A rhythm that works

- File material when it arrives; the library is searchable at once.
- Say "consolidate" when reminded, or once a week.
- Say "file my quick notes" when kb-note says notes are piling up.
- Run a "health check" once a month, and "archive old versions" when it finds duplicates.

Nothing is ever deleted: older versions and run logs stay in the archive folder.

When something does not behave as described: [troubleshooting.md](troubleshooting.md).
