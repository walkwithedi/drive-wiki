# drive-wiki（Drive 常青知识库）

由 Claude 维护、放在 Google Drive 文件夹里的个人知识库，内容始终现行有效：每个常问的问题只有一个现行答案，每个答案注明出自哪个文件，任何东西都不删除。三个 skill 在 claude.ai 和 Claude 应用里完成工作；可选的 Apps Script 收件箱在 Drive 里自动完成交付结果的入库。

| skill | 口令 | 作用 |
| --- | --- | --- |
| kb-note | 「记一下」「把这个回答存下来」 | 把对话中的零碎信息或值得留存的回答存为随手记，日后批量入库 |
| kb-ingest | 「增量整理」「整合」「整理随手记」「归档旧版」「体检」「新建知识库」 | 分区、查重、版本判定，每份材料只保留一个现行版本，事实变化时更新状态卡，定期体检（含核对状态卡里的数字和日期能否在出处原文中找到） |
| kb-query | 直接提问 | 先在知识库检索再作答，注明依据文件，不凭记忆回答 |

[English](README.md)

## 适合谁

一个人管理自己的知识，生活和工作都行，随时随地用 Claude 手机应用来问。

- **日常不需要电脑**：记录、提问、入库都能在手机上的 Claude 应用里完成。一次入库很多文件时，先用任意工具把文件转成 Markdown，并启用[收件箱](docs/inbox.zh-CN.md)，手机上也跑得顺。每份文档转成一个 Markdown，各自的版本和查重互不影响；整批合成一个文件也可以，会作为一份材料入库。
- **现行且有出处**：新版本替换旧版本，状态卡只保留现行结论。完整入库（`intake.mode: full`）时每个文件入库就当场更新状态卡，快速入库（预设）在整合后更新。每条事实注明出处文件，状态卡改动写入前先对照原文核对。
- **普通的 Drive 文件夹**：不用装 git、终端或服务器；上传的 Word、PDF 和邮件会先转成文字。
- **不适合**：多人同时往一个库里写入（没有防止同时写入的保护）；也不适合需要逐行改动历史、库完全离线的人，这种需求用本地 Markdown 文件夹加 git 更合适。

## 为什么

助手直接从一堆文档里找答案，返回的是最匹配的那份，哪怕是过时的方案。drive-wiki 在材料进来时就做一次梳理，把结果以普通 Markdown 文件保存在你的 Drive 里：

- **名称即版本**：文档的新版本沿用旧版的文件名，旧版移入归档文件夹。任何东西都不删除。
- **每个库一张状态卡**：每个常问问题的现行答案都在上面，每条链接到出处。只有新材料与它相抵触时才改写，并由脚本核对改写后没有丢条目。
- **有证据才改**：判重复、判新版本、判事实变化，都要有原文为证；没有就取保守做法。
- **库自己的规范**决定分区和议题。材料放不进现有议题时规范会扩充，每次都告诉你。
- **先快速入库，再整合**：每个文件入库后立刻可查；与汇总文件的比对放到之后的整合环节，由你审阅。

完整的道理见 [docs/methodology.zh-CN.md](docs/methodology.zh-CN.md)。

## 整体结构

- **技能**（kb-note、kb-query、kb-ingest）：claude.ai 加载的说明和脚本，具体工作由它们完成。
- **知识库**：一个 Drive 文件夹，里面是 Markdown 文件，加上配置（`_kb.json`）、流程参数（`_kb-params.md`）、规范、状态卡和文件索引。可以有多个，比如一个生活库、一个工作库。
- **注册表**（`kb-libraries.json`，存在 Drive 里）：登记你有哪些库，以及每个库的 id、名称、范围和文件夹 ID。技能靠它决定每次请求用哪个库。
- **项目指令里的一行**：告诉 Claude 你有知识库、注册表在哪里，让它先查库，再凭记忆回答。
- **收件箱**（可选，见 [docs/inbox.zh-CN.md](docs/inbox.zh-CN.md)）：你 Google 账号里的一个 Apps Script，把入库交付的 zip 解压分拣、归档旧版，并发邮件告诉你结果。

```text
你 --提问--> Claude（在项目里）--读取--> 指令里的一行（registry: Drive folder ...）
                 |
                 +-- 技能（kb-query、kb-note、kb-ingest）
                       +-- 注册表 kb-libraries.json：用哪个库、哪个文件夹
                       +-- 知识库文件夹：Markdown 文件、状态卡、文件索引
                 |
                 +-- （zip 交付）--> 收件箱文件夹 --> Apps Script --> 知识库文件夹
```

## 快速上手

1. 从 [Releases](../../releases) 下载 `kb-note`、`kb-query`、`kb-ingest`（带 `-zh` 的是中文口令版），在 claude.ai 的「设置 → Capabilities → Skills」逐个上传。
2. 连接 Google Drive，为知识库新建一个空文件夹，再为知识库建一个项目（Project）。
3. 在项目里说「开始使用知识库」。Claude 问三个问题（放在哪里、用哪个预设、收录什么），给出预览，把库写进文件夹，再给你一行话贴进项目指令。贴好、保存，在项目里新开对话即可。

逐步说明和每一步写了什么，见 [docs/setup.zh-CN.md](docs/setup.zh-CN.md)。虚构的[示例库](examples/)展示了入库几次之后库的样子。

## 从 1.x 升级

2.0 起入库技能改名为 kb-ingest（原名 kb-incremental）。claude.ai 按名字区分技能，上传 kb-ingest 会新增一个技能而不是替换旧的，两个会抢同样的口令。

1. 在 claude.ai 的「设置 → Capabilities → Skills」删除 kb-incremental。
2. 上传三个 2.0 的 zip：kb-note、kb-query、kb-ingest。

知识库、注册表、收件箱和项目指令里的那一行都不用改。

## 库的样子

```text
life-kb/
  _kb.json                 配置：语言、时区、文件名、敏感分级、转换
  _kb-params.md            流程参数：哪些要精读、什么算变化
  00_Spec.md               分区与议题、术语修正、阈值、实体
  00_Status-Card.md        现行事实，每条链接到出处
  01_File-Index.md         每份已入库文档及其原始文件名和哈希
  01_Open-Items.md         到期与待办（生活库）或待决事项（工作库）
  01_Change-Log.md         事实随时间的变化
  01_Glossary-Issues.md    术语修正、打码记录、遗留问题
  02_Checkups_report_2026-annual.md
  ...
  Entities/                每个人、机构或系统一页
  Archive/                 旧版本与运行日志
  Quick-Notes/             待入库的随手记
```

所有文件名都可在 `_kb.json` 里配置，其他语言的库保留自己的文件名。新建库有两个预设：生活（健康、财务、保险、住房、家庭、证件与法律事务、设备订阅与出行、学习、参考资料）和工作（目标与计划、项目与任务、方案与成果、会议与决定、制度与流程、组织与职责、数据与报告、参考与模板）。

## 下载

每个发行版都附带：

| 文件 | 用途 |
| --- | --- |
| `kb-note-<版本>.zip`、`kb-query-<版本>.zip`、`kb-ingest-<版本>.zip` | 上传到 claude.ai 或 Claude 应用 |
| 同名、以 `-zh.zip` 结尾的文件 | 同样的技能，中文口令 |
| `drive-wiki-v<版本>.zip` | 整个仓库：技能、收件箱脚本、文档和示例库 |

## 仓库目录

| 路径 | 内容 |
| --- | --- |
| `skills/` | 三个技能；`shared/` 是各技能都带一份副本的共用文件 |
| `locales/zh/` | 中文口令，打包时换入 |
| `apps-script/kb_inbox.gs` | 收件箱脚本；`scripts/deploy_apps_script.sh` 用 clasp 推送 |
| `docs/` | 方法论、上手步骤、收件箱 |
| `examples/` | 示例库与收件箱配置 |
| `tests/`、`scripts/` | 脚本测试、打包、仓库检查、敏感信息扫描 |

## 开发

```bash
git config core.hooksPath .githooks       # 每次克隆后执行一次：每次提交前跑全部检查
python3 scripts/run_checks.py             # 测试、仓库检查、共用副本、敏感信息扫描
python3 scripts/build_skill.py            # 打包到 dist/（--locale zh 为中文口令版）
```

技能、共用文件、测试和收件箱脚本从维护者的上游同步过来，见 [CONTRIBUTING.md](CONTRIBUTING.md)。许可证：[MIT](LICENSE)。
