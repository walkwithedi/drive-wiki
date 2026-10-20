# Examples

Everything here is fictional.

## sample-life-kb

A small life library as it looks after a few intakes: settings, spec, status card, file index, change log, open items, glossary, two topic files, two entity pages and a quick note. sample-materials/ holds a new document to file into it.

To try it in claude.ai:

1. Upload the contents of sample-life-kb/ (not the folder itself) to an empty Google Drive folder, keeping the Entities and Quick-Notes subfolders. Upload the `.md` and `.json` files as they are; do not convert them to Google documents.
2. In your knowledge-base Project, say "init" and give that folder's link. Init mode finds the spec, keeps the library's files as they are and registers the folder (see [docs/setup.md](../docs/setup.md)).
3. Try, in order:
   1. "What is my cholesterol trend?" (kb-query reads the status card and the 2025 checkup)
   2. "Note this: the boiler service is due in March." (kb-note writes to Quick-Notes/)
   3. "File this" with sample-materials/checkup_2026.txt (kb-ingest: new material in partition 02, a value change for consolidation)
   4. "Consolidate" (the status card update, proposed as a numbered list)
   5. "File my quick notes"
   6. "Health check"

Work on a copy if you want to keep the sample unchanged. The repository checks validate sample-life-kb/_kb.json.

## Inbox configurations

inbox-config.en.json and inbox-config.zh.json show the inbox configuration file ([docs/inbox.md](../docs/inbox.md)) with English keys and folder names, and with Chinese keys and the default Chinese folder names. Save one as `_inbox.json` or `_收件箱配置.json` in the library root and change the values to match the library's `_kb.json`.

---

# 示例（中文说明）

这里的内容全部是虚构的。

sample-life-kb 是入库几次之后的小型生活库：配置、规范、状态卡、文件索引、变更轨迹、到期与待办、术语表、两份议题文件、两个实体页和一条随手记。sample-materials/ 里有一份可以入库的新文档。

在 claude.ai 里试用：把 sample-life-kb/ 里的内容（不是文件夹本身）上传到 Google Drive 的一个空文件夹，保留 Entities 和 Quick-Notes 子文件夹，`.md` 和 `.json` 原样上传、不转换为 Google 文档；在知识库项目里说「初始化」并给出该文件夹链接，初始化模式会找到规范、保留库里的文件并登记这个文件夹（见 [docs/setup.zh-CN.md](../docs/setup.zh-CN.md)）。然后依次试：问「我的胆固醇趋势如何？」；「记一下：锅炉三月该保养了」；上传 sample-materials/checkup_2026.txt 说「入库」；「整合」；「整理随手记」；「体检」。想保留示例原样，请在副本上操作。

inbox-config.en.json 和 inbox-config.zh.json 分别是英文键加英文文件夹名、中文键加中文默认文件夹名的收件箱配置示例（见 [docs/inbox.zh-CN.md](../docs/inbox.zh-CN.md)）。存为库根目录下的 `_inbox.json` 或 `_收件箱配置.json`，取值改成与库的 `_kb.json` 一致。
