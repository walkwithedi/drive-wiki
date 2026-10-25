# drive-wiki（Drive 常青知识库）

由 Claude 维护、放在你 Google Drive 里的个人知识库，内容始终是现行的。在手机上的 Claude 应用里提问，得到的是一个现行答案，并注明出自哪个文件。三个 skill 在 claude.ai 和 Claude 应用里完成工作；知识库就是你自己的一个普通 Markdown 文件夹。

[English](README.md) · 想在自己电脑上离线使用、由本地模型维护的知识库，见 [evergreen-wiki](https://github.com/walkwithedi/evergreen-wiki)。

## 用起来是什么样

向虚构的[示例库](examples/)提问（回复有删节）：

```text
你：    我的胆固醇趋势如何？
Claude：知识库：生活库
        2025 年体检总胆固醇 5.6 mmol/L，高于参考值 5.2；建议 12 个月后复查。
        库里目前只有这一次体检，还谈不上趋势。
        依据：02_Checkups_report_2025-annual.md
```

答案来自库的状态卡，每行一条现行事实，各自注明出处：

```text
1. 2025 年体检：总胆固醇 5.6 mmol/L，高于参考值 5.2；建议 12 个月后复查
   （依据：02_Checkups_report_2025-annual）
2. 云存储订阅 2026-11-01 续费，每年 99.00（依据：……）
```

把 2026 年的体检报告入库后说「整合」：第 1 条会被提出更新，你同意后才改；2025 年的报告仍留在库里，作为上一次的结果。

## 你能得到什么

- **现行答案，而不是最匹配的那份**：材料进来时新版本就替换旧版本，过时的方案或旧说法不会再被当作答案。
- **每条事实都有出处**：回答注明依据文件；库里没有记录的，就说没有记录，不凭记忆补。
- **什么都不丢**：旧版本移入归档文件夹，不删除任何东西；每次写入前都先给你看。
- **在你自己的 Drive，用你的手机**：库留在你自己的 Drive 里，按正文全文检索；记录、入库、提问都在 Claude 应用里完成，不用 git、不用提交。原因见 [docs/methodology.zh-CN.md](docs/methodology.zh-CN.md#为什么用-google-drive-和-claudeai)。

| skill | 口令 | 作用 |
| --- | --- | --- |
| kb-note | 「记一下」「把这个回答存下来」 | 把零碎信息或值得留存的回答存为随手记，日后入库 |
| kb-ingest | 「入库」「整合」「体检」「开始使用知识库」 | 整理材料入库，每份文档只保留一个现行版本，经你审阅后更新状态卡，检查库的健康状况 |
| kb-query | 直接提问 | 先查知识库再作答，注明每条事实出自哪个文件 |

全部口令以及每个口令之后会发生什么，见 [docs/daily-use.zh-CN.md](docs/daily-use.zh-CN.md)。

## 快速上手

需要：一个能用 Skills 的 claude.ai 套餐；在「设置 → Capabilities」里打开 **Code execution and file creation**（代码执行与文件创建）；连接 Google Drive；第一次安装用网页版或桌面版。

1. 从 [Releases](../../releases) 下载 `kb-note`、`kb-query`、`kb-ingest` 三个 zip（带 `-zh` 的是中文口令版），在「Customize → Skills」逐个上传。
2. 在 Google Drive 新建一个空文件夹放知识库，再为知识库建一个项目（Project）。
3. 在项目里说「开始使用知识库」。Claude 问三个问题，给出预览，写好知识库，再给你一行话贴进项目指令。贴好、保存，在项目里新开对话。
4. 自检：问「我有哪些知识库？」，Claude 能说出你的库名，就是装好了。

逐步说明见 [docs/setup.zh-CN.md](docs/setup.zh-CN.md)；遇到问题见 [docs/troubleshooting.zh-CN.md](docs/troubleshooting.zh-CN.md)。

## 适不适合你

- **适合**：一个人管理自己的知识，生活和工作都行，随时随地提问。记录、提问、入库都能在手机上的 Claude 应用里完成。一次入库很多文件时，先在电脑上把文件转成 Markdown（比如用 [doc2kb](https://github.com/walkwithedi/doc2kb)），也可以考虑启用[收件箱](docs/inbox.zh-CN.md)。
- **不用服务器**：不用装 git、终端或服务器；上传的 Word、PDF 和邮件会先转成文字。
- **不适合**：多人同时往一个库里写入（没有防止同时写入的保护）；需要逐行改动历史或完全离线的库。

## 它怎样保持现行

- **名称即版本**：文档的新版本沿用旧版的文件名，旧版移入归档文件夹。
- **每个库一张状态卡**：每个常问问题的现行答案都在上面。只有新材料与它相抵触时才改写，改写前由你审阅，并由脚本核对没有丢条目、数字和日期能在出处原文里找到。
- **有证据才改**：判重复、判新版本、判事实变化，都要有原文为证；没有就取保守做法。
- **先快速入库，再整合**：每个文件入库后立刻可查；状态卡在你说「整合」时更新。

完整的道理见 [docs/methodology.zh-CN.md](docs/methodology.zh-CN.md)。

组成：三个 **skill**；一个或多个**知识库**（Drive 文件夹，比如一个生活库、一个工作库）；Drive 里登记各库的一个小**注册表**文件；**项目指令里的一行**，告诉 Claude 注册表在哪里；以及可选的**收件箱** Apps Script，自动把交付的 zip 分拣入库。

一个库里有：

```text
life-kb/
  00_Spec.md               分区与议题、术语修正、阈值
  00_Status-Card.md        现行事实，每条链接到出处
  01_File-Index.md         每份已入库文档及其原始文件名和哈希
  01_Open-Items.md         到期与待办（生活库）或待决事项（工作库）
  01_Change-Log.md         事实随时间的变化
  02_Checkups_report_2025-annual.md
  ...
  Entities/  Archive/  Quick-Notes/
```

新建库有两个预设：生活（健康、财务、保险、住房、家庭、证件与法律事务、设备订阅与出行、学习、参考资料）和工作（目标与计划、项目与任务、方案与成果、会议与决定、制度与流程、组织与职责、数据与报告、参考与模板）。所有文件名都可以配置。

## 文档

| 文档 | 内容 |
| --- | --- |
| [上手步骤](docs/setup.zh-CN.md) | 准备条件、安装、建第一个库、新增库、注册表 |
| [日常使用](docs/daily-use.zh-CN.md) | 每件事怎么说、之后会发生什么 |
| [问题排查](docs/troubleshooting.zh-CN.md) | 症状、原因与处理办法 |
| [收件箱](docs/inbox.zh-CN.md) | 可选的 Apps Script，自动分拣交付的 zip |
| [方法论](docs/methodology.zh-CN.md) | 规则为什么这样定 |
| [示例库](examples/) | 用来试用全部功能的虚构知识库 |
| [变更记录](CHANGELOG.md) | 各版本改了什么；从 1.x 升级见 2.0.0 一节 |

每个发行版附三个 skill 的 zip、对应的 `-zh` 版和整个仓库的 zip（[下载哪个](docs/release-downloads.md)）。

参与贡献、仓库目录与开发见 [CONTRIBUTING.md](CONTRIBUTING.md)。许可证：[MIT](LICENSE)。
