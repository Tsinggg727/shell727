"""SHELL—727 留言接口（Flask 蓝图，给 PythonAnywhere 上的 ConfTrends web app 挂载用）。

功能（与 server.js 行为一致）：
    POST /api/message    收留言（昵称 ≤12 字、正文 ≤80 字、同 IP 每 60 秒最多 3 条）
    GET  /api/messages   查看全部留言 —— 仅限 ?key=密钥，永不公开显示
    GET  /api/health     探活

留言保存在 ~/shell727_data/messages.json ——
注意：这个目录在静态映射之外，绝不能放进任何静态托管目录，否则留言会被公开下载。

接线（PythonAnywhere Web 页 → WSGI 配置文件，在已有代码后面补三行）：
    import sys
    sys.path.insert(0, "/home/tsinggg727")          # shell727_api.py 所在目录
    os.environ.setdefault("SHELL727_ADMIN_KEY", "你的密钥")
    application.register_blueprint(_shell727_bp)

    # 前两行通常已存在；真正要加的只有 setdefault 和 register_blueprint 两行：
    from shell727_api import bp as _shell727_bp
    application.register_blueprint(_shell727_bp)
"""
import hmac
import json
import os
import threading
import time

from flask import Blueprint, jsonify, request

BP_PREFIX = ""          # 路由直接挂在根路径：/api/message、/api/messages、/api/health

DATA_FILE = os.path.join(os.path.expanduser("~"), "shell727_data", "messages.json")
MAX_KEEP = 500          # 最多留存 500 条，超出丢最旧
RATE_WINDOW = 60.0      # 限速窗口（秒）
RATE_MAX = 3            # 窗口内同 IP 最多几条
MAX_BODY = 2048         # 请求体上限（字节）

bp = Blueprint("shell727", __name__)

_lock = threading.Lock()
_rate = {}              # ip -> [timestamps]


def _admin_key():
    return os.environ.get("SHELL727_ADMIN_KEY", "CHANGE_ME")


def _client_ip():
    return str(request.access_route[0]) if request.access_route else "unknown"


def _read_all():
    try:
        with open(DATA_FILE, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (OSError, ValueError):
        return []


def _write_all(items):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(items[-MAX_KEEP:], f, ensure_ascii=False, indent=2)
    os.replace(tmp, DATA_FILE)


def _jsonfail(code, error):
    return jsonify({"ok": False, "error": error}), code


@bp.after_request
def _cors(resp):
    """静态前端（github.io / 子路径）跨域提交留言用；对 API 路由放行 CORS。"""
    if request.path.startswith("/api/"):
        resp.headers.setdefault("Access-Control-Allow-Origin", "*")
        resp.headers.setdefault("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        resp.headers.setdefault("Access-Control-Allow-Headers", "Content-Type")
    return resp


@bp.route(BP_PREFIX + "/api/health")
def health():
    return jsonify({"ok": True, "up": True, "service": "shell727"})


@bp.route(BP_PREFIX + "/api/message", methods=["POST"])
def post_message():
    body = request.get_data(cache=False) or b""
    if len(body) > MAX_BODY:
        return _jsonfail(413, "too large")
    try:
        data = json.loads(body.decode("utf-8"))
    except ValueError:
        return _jsonfail(400, "bad json")
    if not isinstance(data, dict):
        return _jsonfail(400, "bad json")

    nick = str(data.get("nick") or "").strip()[:12]
    text = str(data.get("text") or "").strip()[:80]
    if not text:
        return _jsonfail(400, "empty")

    ip = _client_ip()
    now = time.time()
    with _lock:
        hits = [t for t in _rate.get(ip, ()) if now - t < RATE_WINDOW]
        if len(hits) >= RATE_MAX:
            return _jsonfail(429, "说太快啦，休息一下。")
        hits.append(now)
        _rate[ip] = hits

        items = _read_all()
        items.append({"nick": nick or "路人", "text": text,
                      "time": time.strftime("%Y-%m-%dT%H:%M:%S"), "ip": ip})
        _write_all(items)
    return jsonify({"ok": True})


@bp.route(BP_PREFIX + "/api/messages")
def list_messages():
    given = request.args.get("key", "")
    if not hmac.compare_digest(given, _admin_key()):
        return _jsonfail(401, "wrong key")
    items = list(reversed(_read_all()))[:MAX_KEEP]
    return jsonify({"ok": True, "count": len(items),
                    "list": [{"nick": m.get("nick"), "text": m.get("text"),
                              "time": m.get("time")} for m in items]})
