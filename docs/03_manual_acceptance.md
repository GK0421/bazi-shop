# 手动验收清单 (Agent 5)

**创建时间**：2026-05-18

---

## 一、微信开发者工具导入

- [ ] 打开微信开发者工具
- [ ] 导入项目：`D:\bazi-miniprogram-env\02_workspace\bazi-miniprogram`
- [ ] AppID：`touristappid`（测试用）
- [ ] 编译类型：小程序
- [ ] 编译成功，无报错

---

## 二、首页 (pages/index)

- [ ] 显示"八字便利店"标题
- [ ] 显示副标题"传统干支文化学习工具"
- [ ] "开始分析"按钮可点击
- [ ] "关于项目"按钮可点击
- [ ] 底部有免责声明
- [ ] 无任何"算命/改运/发财"文案

---

## 三、表单页 (pages/form)

- [ ] 可以选择阳历生日（date picker）
- [ ] 可以选择出生时辰（selector，子时~亥时）
- [ ] 可以选择性别（radio 男/女）
- [ ] 可以填写出生地（可选）
- [ ] 可以填写备注（可选）
- [ ] 不选生日直接提交 → Toast"请选择生日"
- [ ] 不选时辰直接提交 → Toast"请选择时辰"
- [ ] 填写必填项后提交 → 显示 loading"分析中..."
- [ ] 提交后跳转结果页

---

## 四、结果页 (pages/result)

- [ ] 显示 report.title
- [ ] 显示 report.summary（长文本）
- [ ] 显示 report.disclaimer（高亮样式）
- [ ] 显示输入信息（birthday/hour/gender/location）
- [ ] "返回首页"按钮可用
- [ ] 点击返回首页 → 回到 pages/index

---

## 五、关于页 (pages/about)

- [ ] 显示项目来源说明
- [ ] 显示 bazi-skill 来源（MIT License）
- [ ] 显示技术架构说明
- [ ] 显示版本号 v1.0.0
- [ ] 显示重要声明（文化学习，非预测）
- [ ] 点击 GitHub 链接可复制
- [ ] "返回首页"按钮可用

---

## 六、云函数环境配置

- [ ] 在微信云开发控制台配置环境变量：
  - `LLM_PROVIDER` = `minimax`
  - `LLM_BASE_URL` = `https://api.minimax.chat/v1`
  - `LLM_MODEL` = `MiniMax-M2.7`
  - `LLM_API_KEY` = `sk-cp-...`（MiniMax 真实 Key）
- [ ] 上传并部署 cloudfunctions/analyzeBazi
- [ ] 真机测试：正常输入 → 收到 ok:true 结果

---

## 七、安全检查

- [ ] GitHub 仓库不包含 `.env.local`
- [ ] GitHub 仓库不包含 `project.private.config.json`
- [ ] GitHub 仓库不包含任何 `sk-` 字符串
- [ ] 微信云函数日志不打印 API Key

---

## 八、合规检查

- [ ] 小程序名称：八字便利店
- [ ] 小程序简介：传统干支文化学习工具
- [ ] 所有页面无"算命大师/改运/发财"文案
- [ ] 所有页面有免责声明
- [ ] 小程序选择"工具"类目（不选命理/占卜）
