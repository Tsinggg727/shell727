"""SHELL—727 · PythonAnywhere 独立 web app 入口：同时提供前端页面 + 留言接口。

适用于给个人网站单独建一个 web app 的情况（ConfTrends 那个 app 不用动）。

PythonAnywhere Web 页 → WSGI configuration file 里，把内容换成：

    import os
    os.environ["SHELL727_ADMIN_KEY"] = "换成你自己的密钥"

    import sys
    sys.path.insert(0, "/home/tsinggg727/shell727")
    from flask_app import app as application

（默认 Python 3.10 即可，无需 virtualenv——只用 Flask 本体。）

本地预览：ADMIN_KEY=test123 python flask_app.py 后访问 http://127.0.0.1:5000
"""
import mimetypes
import os
import sys

# 确保 .webp 有正确的 MIME（部分 Python 版本的 mimetypes 不认识它）
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/svg+xml", ".svg")

BASE = os.path.dirname(os.path.abspath(__file__))
if BASE not in sys.path:
    sys.path.insert(0, BASE)

from flask import Flask, send_from_directory

app = Flask(__name__)
app.json.ensure_ascii = False

from shell727_api import bp          # noqa: E402  留言接口（/api/message 等）

app.register_blueprint(bp)


@app.route("/")
def index():
    return send_from_directory(BASE, "index.html")


@app.route("/<path:filename>")
def assets(filename):
    # 其余文件（styles.css / app.js / assets/...）直接按路径提供；
    # 页面用 hash 路由（#/home 等），服务器只需认得 "/" 一个入口
    return send_from_directory(BASE, filename)


if __name__ == "__main__":
    app.run(debug=True)
