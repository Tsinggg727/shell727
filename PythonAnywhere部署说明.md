# PythonAnywhere 部署说明（子路径版）

你的 PythonAnywhere 根域名 `tsinggg.pythonanywhere.com` 已经跑着 ConfTrends，
个人主页**不能**占用根目录，所以放在子路径下，两者互不影响：

- ConfTrends 不动：`https://tsinggg.pythonanywhere.com/`
- 个人主页：`https://tsinggg.pythonanywhere.com/727/`（前缀可自选）

## 第 1 步：把代码拉到 PythonAnywhere

先确认 GitHub 上已经有 `shell727` 仓库（见 README 的部署方法），
然后 PythonAnywhere 控制台 → **Consoles → Bash**：

```bash
cd ~
git clone https://github.com/Tsinggg727/shell727.git
```

## 第 2 步：加静态文件映射

控制台 → **Web** 标签页 → 找到你的 web app（tsinggg.pythonanywhere.com）→
**Static files** 区块 → Add a new mapping：

| URL                          | Directory                   |
|------------------------------|-----------------------------|
| `/727/`                      | `/home/tsinggg727/shell727` |

（URL 前缀想换别的也行，两边保持一致即可；Directory 填 clone 出来的文件夹绝对路径。）

## 第 3 步：Reload

同一个 Web 页面顶部点绿色的 **Reload** 按钮。

浏览器访问 `https://tsinggg.pythonanywhere.com/727/` —— 看到「欢迎光临！」就成功了。
站内是 hash 路由（`#/home` `#/profile`…），全部在浏览器端完成，子路径不影响任何跳转。

## 以后更新内容

改完代码推到 GitHub 后，PythonAnywhere 的 Bash 里：

```bash
cd ~/shell727 && git pull
```

再到 Web 页面点一次 **Reload**。

## 注意：留言后端在这台服务器上跑不了

PythonAnywhere 免费版**只支持 Python web app**（且只暴露 80/443，开不了 8787 端口），
`server.js`（Node）在这里运行不了。所以静态部署下，「壳内壁涂鸦」的留言
只保存在访客自己的浏览器里（localStorage），你收不到。

想真正收到留言，两条路任选：

1. **华为云服务器跑 `server.js`**（步骤见《后端部署说明.md》），然后把前端
   `app.js` 里的 `MESSAGE_API` 填上服务器地址；
2. **把留言接口改写成 Flask**，挂进 ConfTrends 现有的 wsgi.py 里
   （`tsinggg.pythonanywhere.com/api/message` 就能收留言）——要走这条路告诉我，我帮你改。
