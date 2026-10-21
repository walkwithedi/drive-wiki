# 上手步骤

在 claude.ai 或 Claude 应用里新建知识库的步骤、每一步写了什么，以及怎样新增、更新或试用一个库。[English](setup.md)

## 需要准备

开始前逐项核对；缺了哪一项，往往到后面才表现为 skill 不起作用或凭记忆回答。

- [ ] 一个能用 Skills 的 claude.ai 套餐（[哪些套餐](https://support.claude.com/en/articles/12512180-use-skills-in-claude)）。
- [ ] 在「设置 → Capabilities」打开 **Code execution and file creation**（代码执行与文件创建）。skill 在 Claude 的代码沙箱里运行，不打开就无法工作。Team 和 Enterprise 套餐还需要管理员在组织设置里允许代码执行和 Skills。
- [ ] 连接 Google Drive，用的是将来存放知识库的那个 Google 账号。
- [ ] 上传 skill 用 claude.ai 网页版或桌面版；装好以后，手机应用里也能用全部功能。
- [ ] 每个知识库一个 Google Drive 文件夹，新建库时须为空文件夹。
- [ ] 一个用于知识库的项目（Project）。只有项目指令能在各次对话之间保留，告诉 Claude 你有知识库的那一行就写在这里。

## 1. 上传技能

从 [Releases](../../../releases) 页面下载三个 zip：`kb-note-<版本>.zip`、`kb-query-<版本>.zip`、`kb-ingest-<版本>.zip`。想用中文口令就改下带 `-zh` 的三个；同一个技能不要两种版本都装，否则会抢同样的口令。整个仓库的 zip 这里用不到。

打开「Customize → Skills」，点「+」→「Create skill」→「Upload a skill」，把第一个 zip 原样上传（不要解压）。另外两个照做，然后确认三个都已打开。

以后更新时，在同一处上传新的 zip 替换旧版即可，知识库不用改。

## 2. 建第一个库

在项目里、连好 Google Drive 后，说「开始使用知识库」。kb-ingest 会：

1. 逐个问三个问题：知识库放在哪个 Drive 文件夹（链接或文件夹 ID；须已存在且为空）、用哪个预设（生活或工作）、一句话说明库里收录什么（范围，用来把每次请求分给对的库）。
2. 自行确定其余各项：名称和 id、语言、时区、敏感分级（生活库开启）、上传文件先转换为 Markdown（开启）。
3. 给出预览，列出将写入的全部内容。你回复「确认」之前什么都不写；任何一项都可以先改。
4. 写入文件夹：`_kb.json`、`_kb-params.md`、规范（`00_Spec.md`）、空的汇总文件，以及归档、随手记和（YAML 模式下）实体文件夹。
5. 把注册表 `kb-libraries.json` 写进这第一个库的根目录。
6. 给你一行话，贴进项目指令：

   ```text
   我有知识库，库的清单与范围在 Google Drive 里（registry: Google Drive folder <文件夹ID>, file kb-libraries.json）。可能记在知识库里的问题，先用 kb-query 查知识库，再查代码或凭记忆回答；要记录用 kb-note。
   ```

   其中 `registry: ...` 这一段无论哪种语言都保持英文。

把这一行贴进项目指令、保存，然后在项目里新开对话。

自检：在这个新对话里问「我有哪些知识库？」。Claude 应能说出库名和范围。说不出，或说还没有设置知识库，就是那一行没贴、没保存，或者对话不在这个项目里；见[问题排查](troubleshooting.zh-CN.md)。

## 3. 试一试

1. 上传一份文档，说「入库」。入库会给它分区、命名、查重和判定版本，预览后写入，报一行进度。写入后立刻可查。
2. 问一个这份文档能回答的问题。kb-query 先读状态卡、再读文件，回答里注明依据文件。
3. 说「整合」。kb-ingest 给文件补关键结论，把对状态卡的改动编号列出，由你决定采用哪些。

其他口令：「记一下：……」（kb-note）、「整理随手记」「归档旧版」「体检」。 <!-- sensitive-scan: ignore -->
全部口令及之后会发生什么，见[日常使用](daily-use.zh-CN.md)；遇到问题见[问题排查](troubleshooting.zh-CN.md)。

## 新增一个库

在项目里说「新建知识库」。同样是三个问题和一次预览；新库登记进 Drive 里的注册表（旧的注册表副本移入归档文件夹），项目指令不用改。

已有的库（文件夹里已有规范，比如[示例库](../examples/)）用同样的方式接入：说出它的文件夹，初始化模式读取规范、推导 `_kb.json`，缺 `_kb-params.md` 时给出草稿，并在不改动知识文件的前提下登记这个文件夹。

## 注册表

`kb-libraries.json` 是普通 JSON。初始化模式会维护它，你也可以在 Drive 里直接修改（在指令那一行写明的文件夹里只保留一份）：

```json
{
  "schema": 1,
  "preferences": {"language": "zh", "output": "plain"},
  "libraries": [
    {"id": "life", "label": "生活库", "scope": "本人与家人的证件、健康、保险、财务、住房",
     "backend": {"type": "gdrive", "root": "<文件夹ID>"}},
    {"id": "work", "label": "工作库", "scope": "团队项目、决定、规范、负责人",
     "backend": {"type": "gdrive", "root": "<文件夹ID>"}}
  ]
}
```

- `scope` 决定请求交给哪个库，每条写成意思清楚的一句话。
- `preferences.output` 取 `markdown` 或 `plain`（回复不用任何 Markdown 标记）。
- 每一项都是 Google Drive 文件夹（`"type": "gdrive"`）；其他类型的条目会被拒绝。

也可以把注册表打进技能 zip 自用：`python3 scripts/build_skill.py --config my-registry.json` 会把它写进每个 zip。这样的 zip 含有你的文件夹 ID，不要公开。

## 库的设置

`_kb.json` 和 `_kb-params.md` 放在库的根目录，技能每次都会读取。`_kb.json` 的各项（语言、时区、文件名、敏感分级、分区、交付方式、转换、入库）见 [skills/kb-ingest/references/config.md](../skills/kb-ingest/references/config.md)。说「初始化」并指明这个库，初始化模式会按规范核对并补齐。

想把入库结果打成 zip、经 Apps Script 收件箱交付而不是直接写入，见 [inbox.zh-CN.md](inbox.zh-CN.md)。
