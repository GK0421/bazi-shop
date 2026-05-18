# Git 用户信息未设置 — 需要手动完成

执行以下命令设置 Git 用户信息（只需一次，之后全局生效）：

```bash
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的GitHub邮箱"
```

设置完成后，执行首次提交：

```bash
cd D:\bazi-miniprogram-env\02_workspace\bazi-miniprogram
git add .
git commit -m "chore: initialize bazi miniprogram environment scaffold"
```
