#!/usr/bin/env bash
# 把 apps-script/kb_inbox.gs 推送到一个或多个 Apps Script 项目（各库一个项目）。
# 用法：bash scripts/deploy_apps_script.sh <脚本ID>...（在本工具目录下运行；也可用绝对路径）
# 环境变量：CLASP_AUTH 指向 clasp login 生成的 .clasprc.json（默认 ~/.clasprc.json）；CLASP 指定 clasp 命令（默认 clasp）。
# 每个项目：先 pull 远端内容，保留远端 appsscript.json 不动，删掉远端全部脚本文件，换成 kb_inbox.gs 后 push；
# 再 pull 一次核对远端代码与仓库逐字节一致。MAIN_FOLDER_ID 与触发器保存在项目里，推送代码不受影响。
set -euo pipefail
log(){ echo "[deploy] $*" >&2; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/apps-script/kb_inbox.gs"
CLASP="${CLASP:-clasp}"
AUTH="${CLASP_AUTH:-$HOME/.clasprc.json}"
[ "$#" -gt 0 ] || { log "用法：deploy_apps_script.sh <脚本ID>..."; exit 2; }
[ -f "$SRC" ] || { log "找不到 $SRC"; exit 2; }
[ -f "$AUTH" ] || { log "找不到凭据文件 $AUTH，请先运行 clasp login"; exit 2; }
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
log "源文件=$SRC（$(wc -c < "$SRC") 字节）项目数=$# clasp=$("$CLASP" -v)"

FAILED=0
for ID in "$@"; do
  TAG="项目 ${ID:0:6}…${ID: -4}"   # 日志里只露头尾，便于对照又不整串打印
  DIR="$WORK/$ID"; CHECK="$WORK/$ID.check"
  mkdir -p "$DIR" "$CHECK"
  printf '{"scriptId":"%s"}\n' "$ID" > "$DIR/.clasp.json"
  cp "$DIR/.clasp.json" "$CHECK/.clasp.json"
  if ! (cd "$DIR" && "$CLASP" -A "$AUTH" pull >&2); then
    echo "::error::$TAG 拉取失败（脚本ID不对、账号无权限或未开启 Apps Script API）" >&2; FAILED=1; continue
  fi
  if [ ! -f "$DIR/appsscript.json" ]; then
    echo "::error::$TAG 远端没有 appsscript.json，停止推送" >&2; FAILED=1; continue
  fi
  OLD=$(cd "$DIR" && find . -type f ! -name .clasp.json ! -name appsscript.json | sed 's|^\./||' | sort)
  log "$TAG 远端现有文件：$(echo $OLD)"
  if echo "$OLD" | grep -qvE '\.(gs|js)$|^$'; then
    echo "::error::$TAG 远端含非脚本文件（如 HTML），不自动覆盖，请人工处理" >&2; FAILED=1; continue
  fi
  (cd "$DIR" && find . -type f \( -name '*.gs' -o -name '*.js' \) -delete)
  cp "$SRC" "$DIR/kb_inbox.gs"
  log "$TAG 推送：远端脚本文件将替换为 kb_inbox.gs，appsscript.json 用远端原样（-f 仅为避免非交互环境下因清单格式差异而跳过推送）"
  if ! (cd "$DIR" && "$CLASP" -A "$AUTH" push -f >&2); then
    echo "::error::$TAG 推送失败" >&2; FAILED=1; continue
  fi
  if ! (cd "$CHECK" && "$CLASP" -A "$AUTH" pull >&2); then
    echo "::error::$TAG 推送后核对时拉取失败" >&2; FAILED=1; continue
  fi
  GOT=$(cd "$CHECK" && find . -type f \( -name '*.gs' -o -name '*.js' \) | sed 's|^\./||')
  if [ "$(echo "$GOT" | wc -l)" -ne 1 ] || ! cmp -s "$SRC" "$CHECK/$GOT"; then
    echo "::error::$TAG 核对不一致：远端脚本文件为「$(echo $GOT)」，内容与仓库不同" >&2; FAILED=1; continue
  fi
  log "$TAG 完成：远端仅有 $GOT，内容与仓库一致"
done
exit "$FAILED"
