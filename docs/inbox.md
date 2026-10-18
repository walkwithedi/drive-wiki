# The Apps Script inbox

An optional Google Apps Script that files intake results in Drive on its own. Intake packs its output into one zip; you upload that zip, as is, to the library's inbox folder; the script unpacks it, archives older versions and mails you what it did. [中文](inbox.zh-CN.md)

Use it when many files are delivered at once, when the Drive connector cannot write to the library, or when you want a second rule check between the assistant and the library. Without it, direct delivery (the default) writes each file through the connector after you confirm a preview.

## What it does

Every few minutes the script looks at the inbox folder and, for each zip, oldest first:

1. Checks every entry. Root files must be `.md` named with a two-digit partition from `00_` up to the partition limit; entity pages go only in the entities folder; `README.txt` is kept with the zip, not filed. With the YAML check on, topic files must start with front matter; with the sensitive check on, an unmasked 18-character ID number or a 16 to 19 digit card or account number refuses the zip. One bad entry refuses the whole zip: it moves to the error folder with a note naming the file, the line and the rule, never the number itself.
2. Writes each new file into the library root or the entities folder. A file identical to the one already in the library is skipped, so uploading the same zip twice is safe.
3. Moves each older copy with the same name to the archive folder as `<name><old suffix><YYYYMMDDHHMMSS>.md`. New files are written before old ones move, so an interruption can at worst leave two copies of a name, which archive mode tidies.
4. Moves the zip (and its readme) to the archive folder, appends to the log file there and, if mail is on, mails you the summary.

It never deletes anything, and touches nothing outside the library folder.

## The library side

In the library's `_kb.json`:

```json
"intake": {"mode": "full"},
"inbox": {
  "folder": "Inbox",
  "config": "_inbox.json",
  "hint": "Upload the zip as is to the Inbox folder; do not unpack it."
}
```

- An `inbox` entry makes zip the default delivery, and the delivery note tells you to upload the zip to `folder`, adding `hint`.
- `intake.mode` must be `full`. Fast intake also delivers the consolidation queue, whose name starts with an underscore, and the inbox refuses any zip holding such a file.
- Keep `names.readme` at its default, `README.txt`: it is the only readme the inbox accepts.

## The configuration file

`_inbox.json` (or `_收件箱配置.json`, only one of the two) sits in the library root, plain UTF-8 JSON, not converted to a Google document. Keys are all English or all Chinese; mixing them, a missing required key or an unknown key stops the script. Examples: [inbox-config.en.json](../examples/inbox-config.en.json), [inbox-config.zh.json](../examples/inbox-config.zh.json).

| English key | Chinese key | Value |
| --- | --- | --- |
| version | 配置版本 | 1 |
| library | 库名 | the library label, used in logs and mail |
| partition_max | 分区上限 | highest partition number in the spec's Table A (as a number; `_kb.json` partitions.max) |
| topic_start | 议题区起始 | first topic partition (`_kb.json` partitions.topic_start) |
| check_yaml | 检查YAML | true when `_kb.json` metadata is yaml |
| check_sensitive | 检查A级信息 | true when `_kb.json` sensitivity.enabled is true |
| entities_dir | 实体文件夹 | `_kb.json` names.entities_dir |
| mail | 邮件通知 | true to mail a summary after each run that handled a zip |
| interval_minutes | 触发间隔分钟 | 1, 5, 10, 15 or 30 |
| archive_dir | 归档文件夹 | optional; `_kb.json` names.archive_dir |
| inbox_dir | 收件箱文件夹 | optional; `_kb.json` inbox.folder |
| error_dir | 异常文件夹 | optional; inside the inbox folder |
| log_file | 日志文件 | optional; written in the archive folder |
| old_suffix | 旧版后缀 | optional; `_kb.json` names.old_suffix |
| snapshot_prefix | 快照前缀 | optional; `_kb.json` names.snapshot_prefix |

The optional keys default to the Chinese names (归档, 入库收件箱, 异常, _入库收件箱日志.log, _旧, 快照_); a library with English names sets them, as the English example does. The values must match the library's `_kb.json`, which the script does not read.

## Setting it up

One Apps Script project per library; two libraries sharing a project overwrite each other's settings and triggers.

1. Open [script.google.com](https://script.google.com) with the Google account that owns the library and create a project.
2. Paste the whole of [apps-script/kb_inbox.gs](../apps-script/kb_inbox.gs), set `MAIN_FOLDER_ID` at the top to the library's folder ID and save.
3. In Project settings, set the time zone to yours: logs, archive suffixes and zip names use it.
4. Run `setup()` and grant the permissions it asks for. It saves the folder ID, reads the configuration, creates the archive, entities, inbox and error folders if missing, runs `selfTest()` and previews the inbox. Read the log (written in Chinese): the configuration line (配置), the time zone (时区) and the selfTest line ending in 失败0例 (0 failed).
5. Run `enableAutoRun()`. It switches on real runs and installs the timer trigger.

Afterwards:

| Function | Does |
| --- | --- |
| `preview()` | lists what each zip in the inbox would create, skip and archive; changes nothing |
| `run()` | one real run now |
| `showStatus()` | folder ID, configuration, time zone, triggers |
| `disableAutoRun()` | stops real runs and removes the trigger |
| `selfTest()` | the rule checks on built-in cases; reads no library file |

After changing the configuration file, run `setup()` again; after changing `interval_minutes`, run `enableAutoRun()` again. To update the code, paste the new version over the old one and leave `MAIN_FOLDER_ID` empty: the folder ID is kept in the project's script properties. Logs and mail are written in Chinese.

## Deploying with clasp (optional)

[.github/workflows/apps-script-deploy.yml](../.github/workflows/apps-script-deploy.yml) pushes `kb_inbox.gs` to your inbox projects when it changes on main of your fork, or when run by hand, using [scripts/deploy_apps_script.sh](../scripts/deploy_apps_script.sh). The script pulls each project first, keeps its `appsscript.json`, replaces every script file with `kb_inbox.gs`, pushes, and pulls again to check the remote code matches byte for byte. A project that holds non-script files (HTML) is left alone and reported. Folder ID, switches and triggers live in the project and are not touched. First-time setup (steps 2 to 5 above) still happens in the editor.

Once:

1. Turn on the Apps Script API at https://script.google.com/home/usersettings with the library's account. <!-- sensitive-scan: ignore -->
2. Install Node.js and clasp (`npm install -g @google/clasp@3.4.1`), run `clasp login` and allow it with the same account. The credentials land in `~/.clasprc.json`.
3. Copy each inbox project's script ID (Project settings).
4. In your fork's Settings > Secrets and variables > Actions, add the secret `CLASPRC_JSON` (the whole of `~/.clasprc.json`) and the variable `KB_INBOX_SCRIPT_IDS` (script IDs separated by spaces).
5. Run the workflow once by hand (Actions > apps-script-deploy > Run workflow) and check that each project reports a match.

Without the secret and the variable the workflow only warns and skips. `~/.clasprc.json` is a long-lived token that can read and change your Apps Script projects and parts of your Drive: keep it only in the repository secret, never commit or share it, and revoke clasp's access at https://myaccount.google.com/permissions when you no longer need it. A changed password or a revoked grant makes the push fail at the first pull; run `clasp login` again and update the secret.

By hand, from a clone: `bash scripts/deploy_apps_script.sh <script id> ...` (reads `~/.clasprc.json`, or the file named by `CLASP_AUTH`).
