# Apps Script 收件箱

可选的 Google Apps Script，在 Drive 里自动完成入库结果的归位。入库把结果打成一个 zip，你把它原样上传到库的收件箱文件夹；脚本解压分拣、归档旧版本，并发邮件告诉你做了什么。[English](inbox.md)

适合一次交付很多文件、Drive 连接器无法写入知识库，或者想在助手和知识库之间多一道规则检查的情况。不用收件箱时，默认的直接写入在你确认预览后，通过连接器逐个写入文件。

## 它做什么

脚本每隔几分钟查看一次收件箱文件夹，按上传先后逐个处理 zip：

1. 检查每个条目。根目录文件须为 `.md`，以 `00_` 到分区上限的两位分区号开头；实体页只能放在实体文件夹；`README.txt` 随 zip 保存，不入库。开启 YAML 检查时，议题文件须以属性区开头；开启敏感检查时，正文含未打码的 18 位证件号或 16 至 19 位卡号、账号，就拒收整个 zip。有一个条目不合规，整个 zip 就被拒收：移入异常文件夹，并附一份说明，写明文件、行号和规则，从不写号码本身。
2. 把新文件写进库的根目录或实体文件夹。与库里同名文件内容完全相同的跳过，所以同一个 zip 传两次也安全。
3. 把同名的旧版本移入归档文件夹，改名为 `<文件名><旧版后缀><YYYYMMDDHHMMSS>.md`。先写新文件、后移旧版本，中途中断最多留下两个同名文件，可用归档模式收拾。
4. 把 zip（及其说明文件）移入归档文件夹，在那里追加日志；开启邮件时把摘要发给你。

它从不删除任何东西，也不碰知识库文件夹以外的东西。

## 知识库这边

在库的 `_kb.json` 里：

```json
"intake": {"mode": "full"},
"inbox": {
  "folder": "入库收件箱",
  "config": "_收件箱配置.json",
  "hint": "把 zip 原样上传到「入库收件箱」，不要解压。"
}
```

- 有 `inbox` 一项时，默认交付方式变为 zip，交付说明会让你把 zip 上传到 `folder`，并附上 `hint`。
- `intake.mode` 必须是 `full`。快速入库还会交付以下划线开头的待整合清单，收件箱会拒收含这类文件的 zip。
- `names.readme` 保持默认的 `README.txt`：收件箱只认这一个说明文件名。

## 配置文件

`_收件箱配置.json`（或 `_inbox.json`，两者只能有一份）放在库的根目录，UTF-8 编码的普通 JSON，不转换为 Google 文档。键名全用中文或全用英文；中英混写、缺必填项或出现未知字段，脚本都会停止。示例：[inbox-config.zh.json](../examples/inbox-config.zh.json)、[inbox-config.en.json](../examples/inbox-config.en.json)。

| 中文键 | 英文键 | 取值 |
| --- | --- | --- |
| 配置版本 | version | 1 |
| 库名 | library | 库的名称，用于日志和邮件 |
| 分区上限 | partition_max | 规范表 A 中最大的分区号（数字；即 `_kb.json` 的 partitions.max） |
| 议题区起始 | topic_start | 第一个议题分区（`_kb.json` 的 partitions.topic_start） |
| 检查YAML | check_yaml | `_kb.json` 的 metadata 为 yaml 时 true |
| 检查A级信息 | check_sensitive | `_kb.json` 的 sensitivity.enabled 为 true 时 true |
| 实体文件夹 | entities_dir | `_kb.json` 的 names.entities_dir |
| 邮件通知 | mail | true 时每次处理过 zip 后发邮件摘要 |
| 触发间隔分钟 | interval_minutes | 1、5、10、15 或 30 |
| 归档文件夹 | archive_dir | 可选；`_kb.json` 的 names.archive_dir |
| 收件箱文件夹 | inbox_dir | 可选；`_kb.json` 的 inbox.folder |
| 异常文件夹 | error_dir | 可选；在收件箱文件夹下 |
| 日志文件 | log_file | 可选；写在归档文件夹下 |
| 旧版后缀 | old_suffix | 可选；`_kb.json` 的 names.old_suffix |
| 快照前缀 | snapshot_prefix | 可选；`_kb.json` 的 names.snapshot_prefix |

可选项不填时取中文默认名（归档、入库收件箱、异常、_入库收件箱日志.log、_旧、快照_）；使用英文文件名的库要填写，见英文示例。各项取值须与库的 `_kb.json` 一致，脚本不读 `_kb.json`。

## 设置

每个库一个 Apps Script 项目；两个库共用一个项目，设置和触发器会互相覆盖。

1. 用拥有该库的 Google 账号打开 [script.google.com](https://script.google.com)，新建项目。
2. 粘贴 [apps-script/kb_inbox.gs](../apps-script/kb_inbox.gs) 全文，把顶部的 `MAIN_FOLDER_ID` 填为库的文件夹 ID，保存。
3. 在「项目设置」里把时区设为你所在的时区：日志、归档后缀和 zip 改名都按这个时区。
4. 运行 `setup()`，按提示授权。它保存文件夹 ID、读取配置、补建缺失的归档、实体、收件箱和异常文件夹，运行 `selfTest()` 并预演一次收件箱。查看日志：配置一行、时区一行，以及以「失败0例」结尾的 selfTest 一行。
5. 运行 `enableAutoRun()`，开启正式执行并安装定时触发器。

之后：

| 函数 | 作用 |
| --- | --- |
| `preview()` | 列出收件箱里每个 zip 将新建、跳过、归档哪些文件；不改任何东西 |
| `run()` | 立即正式执行一次 |
| `showStatus()` | 文件夹 ID、配置、时区、触发器 |
| `disableAutoRun()` | 停止正式执行并删除触发器 |
| `selfTest()` | 用内置用例跑规则检查；不读知识库文件 |

改了配置文件后再运行一次 `setup()`；改了 `interval_minutes` 后再运行一次 `enableAutoRun()`。更新代码时把新版整份粘贴覆盖，`MAIN_FOLDER_ID` 留空即可：文件夹 ID 已存在项目的脚本属性里。日志和邮件用中文书写。

## 用 clasp 自动部署（可选）

[.github/workflows/apps-script-deploy.yml](../.github/workflows/apps-script-deploy.yml) 在你 fork 的 main 上 `kb_inbox.gs` 有变化时（或手动运行时），用 [scripts/deploy_apps_script.sh](../scripts/deploy_apps_script.sh) 把它推送到你的收件箱项目。脚本先拉取每个项目，保留它的 `appsscript.json`，把所有脚本文件换成 `kb_inbox.gs` 后推送，再拉取一次核对远端代码与仓库逐字节一致。含非脚本文件（HTML）的项目不覆盖，报错等人工处理。文件夹 ID、开关和触发器存在项目里，不受影响。首次设置（上面第 2 到 5 步）仍在编辑器里完成。

一次性配置：

1. 用该库的账号打开 https://script.google.com/home/usersettings ，开启 Apps Script API。 <!-- sensitive-scan: ignore -->
2. 安装 Node.js 和 clasp（`npm install -g @google/clasp@3.4.1`），运行 `clasp login`，用同一账号授权。凭据写入 `~/.clasprc.json`。
3. 复制每个收件箱项目的脚本 ID（项目设置里）。
4. 在你 fork 的 Settings → Secrets and variables → Actions 里，新建 Secret `CLASPRC_JSON`（`~/.clasprc.json` 全文）和 Variable `KB_INBOX_SCRIPT_IDS`（脚本 ID，空格分隔）。
5. 手动运行一次工作流（Actions → apps-script-deploy → Run workflow），确认每个项目都报告一致。

没有配置这两项时，工作流只给警告并跳过。`~/.clasprc.json` 是长期令牌，能读写你的 Apps Script 项目和部分 Drive 内容：只存进仓库 Secret，不要提交或发给别人；不再需要时到 https://myaccount.google.com/permissions 撤销 clasp 的授权。改了密码或撤销授权后，推送会在第一次拉取时失败；重新 `clasp login` 并更新 Secret 即可。

在克隆的仓库里手动部署：`bash scripts/deploy_apps_script.sh <脚本ID> ...`（读取 `~/.clasprc.json`，或 `CLASP_AUTH` 指定的文件）。
