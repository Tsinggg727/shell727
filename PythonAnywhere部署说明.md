# PythonAnywhere 部署说明（前端子路径 + 留言后端）

PythonAnywhere 免费版一个账号只有一个 web app（`tsinggg.pythonanywhere.com`，
现在跑着 ConfTrends），而且只支持 Python——所以：

- **前端**（本网站页面）挂在子路径 `/727/`，用静态文件映射，不碰 ConfTrends；
- **留言后端**写成了一段 Flask 蓝图（本目录的 `shell727_api.py`），挂进
  ConfTrends 同一个 web app 里，借它的域名收留言。

部署完的效果：

| 地址 | 内容 |
|------|------|
| `https://tsinggg.pythonanywhere.com/` | ConfTrends（原样不动） |
| `https://tsinggg.pythonanywhere.com/727/` | SHELL—727 个人网站 |
| `https://tsinggg.pythonanywhere.com/api/message` | 留言接收接口（POST） |
| `https://tsinggg.pythonanywhere.com/api/messages?key=密钥` | 只有你能看的留言列表 |

## 第 1 步：拉前端代码

PythonAnywhere 控制台 → **Consoles → Bash**：

```bash
cd ~
git clone https://github.com/Tsinggg727/shell727.git
```

## 第 2 步：前端静态映射

控制台 → **Web** 标签页 → 你的 web app → **Static files** → Add a new mapping：

| URL     | Directory                   |
|---------|-----------------------------|
| `/727/` | `/home/tsinggg727/shell727` |

## 第 3 步：把留言后端接进 wsgi.py

同一个 Web 页面，找到 **WSGI configuration file**（`/var/www/tsinggg_pythonanywhere_com_wsgi.py`）点开编辑。

① 把后端代码复制到家目录（在 Bash 里执行一次即可）：

```bash
cp ~/shell727/shell727_api.py ~/shell727_api.py
```

② 在 wsgi.py 文件**末尾**追加（`application` 是文件里已有的变量名）：

```python
# ===== SHELL—727 留言接口 =====
import os
os.environ["SHELL727_ADMIN_KEY"] = "换成你自己的密钥"

import sys
sys.path.insert(0, "/home/tsinggg727")

from shell727_api import bp as _shell727_bp
application.register_blueprint(_shell727_bp)
```

> 密钥自己编一个（别用 CHANGE_ME），查看留言时要用；这行写两处的话以最后
> 一次为准。想换密钥就改这里，然后 Reload。

## 第 4 步：Reload + 验证

点绿色 **Reload** 按钮，然后依次检查：

1. `https://tsinggg.pythonanywhere.com/727/` → 看到「欢迎光临！」
2. 打开网站 → 壳内壁涂鸦 → 贴一条留言，提示应为「留言已悄悄收下，不公开显示」
   （如果提示"先存在电脑里"说明后端没通，回来看第 3 步）
3. `https://tsinggg.pythonanywhere.com/api/health` → 返回 `{"ok": true, ...}`
4. `https://tsinggg.pythonanywhere.com/api/messages?key=你的密钥` → 能看到刚才那条

## 以后更新

```bash
cd ~/shell727 && git pull          # 前端更新（后端 shell727_api.py 不在仓库外改动就不用动）
```

改了 wsgi.py 或 shell727_api.py 后，到 Web 页面点一次 **Reload**。

## 常见问题

- **贴留言提示"先存在电脑里"**：后端没通。先看 `/api/health` 是否 200；
  再确认 wsgi.py 里三行都加了、密钥那行没写错位置（要在 `application` 创建之后）。
- **访问不通 / 500**：Web 页面最下方 **Error log**（`tail -3` 之后的最新几行）会写明原因。
- **留言存在哪**：`/home/tsinggg727/shell727_data/messages.json`。
  **这个文件夹不在任何静态映射里，别把它加进 Static files，否则留言会被公开下载。**
- **想备份留言**：偶尔 `cp ~/shell727_data/messages.json ~/messages-backup.json`。

## 关于 ConfTrends

`shell727_api.py` 是独立蓝图，只用 Flask 自带功能，不依赖、不修改 ConfTrends 的
任何代码；路由（`/api/message` 等）和它的 `/api/v1/*` 完全不重叠。想让个人网站
后端下线，删掉 wsgi.py 里追加的那几行再 Reload 即可，ConfTrends 毫发无损。
