# PythonAnywhere 部署说明（独立 web app 版 · 当前实际使用方案）

个人网站部署在**独立账号**的 web app 上：`https://tsinggg727.pythonanywhere.com/`。

两个 PythonAnywhere 账号分工（免费版每号一个 web app，正好一人一个）：

| 账号 | 域名 | 跑什么 |
|------|------|--------|
| tsinggg | tsinggg.pythonanywhere.com | ConfTrends（顶会热词平台） |
| tsinggg727 | tsinggg727.pythonanywhere.com | SHELL—727 个人网站 + 留言接口 |

## 架构

`flask_app.py` 是总入口：`/` 出 index.html，其余路径按文件提供（styles.css /
app.js / assets/…），并把留言蓝图 `shell727_api.py` 注册进同一个应用——
一个 web app 同时当网站和留言后端，不需要任何静态文件映射。

留言接口（与页面前端同域，无跨域问题）：

- `POST /api/message` —— 收留言（昵称 ≤12 字、正文 ≤80 字、同 IP 每 60 秒最多 3 条）
- `GET /api/messages?key=密钥` —— 只有密钥持有者能看，永不公开显示
- `GET /api/health` —— 探活

留言存于 `~/shell727_data/messages.json`（自动创建）。**不要把这个目录加进
任何静态映射**，否则留言会被公开下载。

## 从零重装的步骤（换账号 / 迁移时照做）

1. 建 web app：Web 页 → Add a new web app → **Flask** → Python **3.10**；
2. Consoles → **Bash**：
   ```bash
   cd ~
   git clone https://github.com/Tsinggg727/shell727.git
   ```
3. Web 页 → 打开 **WSGI configuration file**，全选替换为（密钥自己编，记住它）：
   ```python
   import os
   os.environ["SHELL727_ADMIN_KEY"] = "你自己的密钥"

   import sys
   sys.path.insert(0, "/home/tsinggg727/shell727")
   from flask_app import app as application
   ```
   （路径里的 `tsinggg727` 换成所在账号的用户名。）
4. 编辑器左上角 ✓ 保存 → Web 页点绿色 **Reload**；
5. 验证：打开站点看到「欢迎光临！」；`/api/health` 返回 `{"ok": true, ...}`；
   贴一条留言，再用 `/api/messages?key=你的密钥` 查看成功。

## 更新内容

本机改完推到 GitHub 后，PythonAnywhere 的 Bash 里：

```bash
cd ~/shell727 && git pull
```

只改了前端文件（html/css/js）不用 Reload（每次请求都从磁盘读）；改了
`flask_app.py` 或 `shell727_api.py` 才需要点一次 **Reload**。

## 看留言 / 改密钥

- 看留言：`https://tsinggg727.pythonanywhere.com/api/messages?key=你的密钥`
  （按时间倒序，最多 500 条）
- 改密钥：WSGI 配置文件里改 `SHELL727_ADMIN_KEY` 那行 → ✓ 保存 → Reload

## 免费版注意事项

- **Best before date**：免费站点每个月要登录一次，在 Web 页点
  **Run until 1 month from today** 续期，否则会被停（提前一周有邮件提醒）。
  两个账号都要记得点。
- 常见问题：站点 500 看 Web 页最下方 **Error log**；贴留言提示"先存在电脑里"
  说明前端连不上后端（多半是 wsgi 没接对或没 Reload）。
- 备份留言：偶尔 `cp ~/shell727_data/messages.json ~/messages-backup.json`。

## 与 ConfTrends 的关系

互不相干：个人网站在独立账号独立 app 上，ConfTrends 的代码和部署完全没被动过。
想让个人网站下线，直接在 Web 页 Delete 这个 web app 即可，ConfTrends 不受影响。
