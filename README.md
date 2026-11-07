# SHELL—727 个人网站

个人主页网站，包含主页、住户档案、留言墙（壳内壁涂鸦）、小测试、控制面板等
页面，附 Flask 留言接口（见下方「留言说明」）。

线上地址：<https://tsinggg727.github.io/shell727/>

## 文件结构

```
├── index.html                       # 唯一入口（hash 路由：#/home #/profile #/wall #/quiz，未知地址 → 404 页）
├── styles.css                       # 全部样式（含移动端适配）
├── app.js                           # 全部交互逻辑
├── assets/
│   ├── shell727-cut.webp            # 寄居蟹形象（吉祥物）
│   ├── favicon.svg
│   └── patterns/                    # 可选背景纹样（默认关闭，?pat=a 开启）
├── shell727_api.py                  # 留言后端（Flask 蓝图，挂 PythonAnywhere 的 web app）
├── server.js                        # 备选：留言后端（零依赖 Node，自建服务器用）
├── PythonAnywhere部署说明.md        # 当前部署方案：前端子路径 + 后端接线
└── 后端部署说明.md                  # 备选：华为云自建服务器步骤
```

## 本地预览

任选其一：

```bash
# Python
python -m http.server 8127
# 或 Node
npx serve .
```

然后访问 `http://127.0.0.1:8127`。（直接双击 index.html 用 file:// 打开也能看，但留言的本地保存等特性在部分浏览器会受限，建议起本地服务。）

## 部署方法

把**文件夹里的内容**上传到托管服务即可：

- **GitHub Pages（当前使用）**
  1. 本文件夹即仓库根，`git push` 到 `main` 分支即发布；
  2. 仓库 Settings → Pages → Source 选 `main` 分支 `/ (root)`；
  3. 访问 `https://tsinggg727.github.io/shell727/`。
- **PythonAnywhere（当前使用）**：挂在既有应用的子路径下，步骤见
  《PythonAnywhere部署说明.md》。
- **Vercel / Netlify / Cloudflare Pages**：导入仓库或直接拖拽文件夹上传，零配置。
- 注意：文件全部使用相对路径，部署在子目录也能正常工作。

## 留言说明

「壳内壁涂鸦」的留言**不公开显示**。`app.js` 顶部的 `MESSAGE_API` 指向
PythonAnywhere 上的 Flask 留言接口（`shell727_api.py`，接线步骤见
《PythonAnywhere部署说明.md》）：访客贴的留言 POST 到
`tsinggg.pythonanywhere.com/api/message`，只有带密钥访问
`/api/messages?key=密钥` 才能看到；后端没连通时自动退回访客浏览器本地保存。
留言上限 500 条，昵称 ≤12 字、正文 ≤80 字，同 IP 每 60 秒最多 3 条。

## 站点信息速查

- 站名：SHELL—727（727 = 生日 7 月 27 日）
- 页面：主页 / 住户档案 / 壳内壁涂鸦 / 小测试，另有控制面板抽屉与 404 彩蛋页
- 控制面板与首页底部碎碎念共用 20 条冷笑话池（先出题，点「揭晓答案」公布）
- 站主资料（姓名 / 学校 / 专业等）只写在站内住户档案页，本仓库不收录

## 预览开关（调试用，可不加）

- `?shot=1` 跳过开机动画直接呈现终态（截图用）
- `?nointro` 只跳过开机动画
- `?pat=a|b|c|d|off` 切换背景纹样（默认 off）
- `#/panel` 打开控制面板抽屉
