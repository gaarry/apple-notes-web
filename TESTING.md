# Apple Notes Web - 测试指南

## 运行测试

```bash
cd ~/git/apple-notes-web
node test.js
```

## 测试项目

### UI 组件测试
- [x] Sidebar 存在
- [x] CSS 文件存在
- [x] JS 文件存在
- [x] 新建按钮样式
- [x] 搜索框样式
- [x] 编辑器样式

### 功能测试
- [x] 本地存储功能
- [x] 笔记创建
- [x] 搜索功能
- [x] 键盘快捷键
- [x] 渲染函数

### 动画测试
- [x] 淡入动画
- [x] 侧滑动画
- [x] 浮动动画
- [x] 悬停过渡

### 可访问性测试
- [x] 按钮标签
- [x] 输入框占位符
- [x] ARIA 标签

## 持久化验证用例（Gist 同步）

### 前置条件
- Vercel 环境变量已配置：`GIST_ID`、`GITHUB_TOKEN`
- 部署版本已包含 `/api/gist` 代理
- 两台设备/两个浏览器窗口可同时访问同一站点

### 用例 1：跨设备同步（读写）
1. 设备 A 打开站点，点击右下角云同步按钮
2. 点击 `💾 Save Notes`
3. 新建笔记，标题输入 `Persist-Cross-Device-1`，正文输入 `Hello from A`
4. 等待 1-2 秒自动保存后，再点击 `💾 Save Notes`
5. 设备 B 打开站点，点击云同步按钮
6. 点击 `📥 Load Notes`

预期结果：
- 设备 B 列表出现 `Persist-Cross-Device-1`
- 打开后正文为 `Hello from A`

### 用例 2：删除同步
1. 在设备 A 删除 `Persist-Cross-Device-1`
2. 点击 `💾 Save Notes`
3. 设备 B 点击 `📥 Load Notes`

预期结果：
- 设备 B 列表中不再出现该笔记

### 用例 3：无 Token 兜底（本地缓存）
1. 清空浏览器存储，或在无 token 情况下打开站点
2. 新建笔记 `Persist-Local-Cache-1`
3. 点击 `💾 Save Notes`
4. 刷新页面，点击 `📥 Load Notes`

预期结果：
- 状态提示包含 `local cache`
- 刷新后仍能加载 `Persist-Local-Cache-1`

### 用例 4：服务端 API 直接验证（可选）
```bash
curl -sS https://notes.lilboat.cc/api/gist
curl -sS -X POST https://notes.lilboat.cc/api/gist \\
  -H "Content-Type: application/json" \\
  -d '{"notes":[{"id":"persist-test-1","title":"Persist Test","content":"Hello","updatedAt":"2026-02-07T06:00:00.000Z"}]}'
curl -sS https://notes.lilboat.cc/api/gist
```

预期结果：
- GET 返回 `success:true`
- POST 返回 `success:true`
- 再次 GET 返回写入的数据

## 生成报告

```bash
node test.js --report
```

## 本地开发

```bash
# 启动本地服务器
python3 -m http.server 8888

# 访问
# http://localhost:8888
```

## 自动化测试

每小时自动运行测试：

```bash
# 手动运行
cd ~/git/apple-notes-web && node test.js
```

## CI/CD

测试会在以下情况自动运行：
- 每次代码推送
- Pull Request 创建
- Merge 到 main 分支

## 故障排除

### 测试失败
1. 检查文件是否存在
2. 运行 `node test.js --report` 查看详情
3. 验证 CSS/JS 文件语法

### UI 问题
1. 清除浏览器缓存
2. 强制刷新 (Cmd+Shift+R)
3. 检查浏览器控制台错误

## 测试覆盖

当前：18/18 测试通过
- UI 组件：6/6
- 功能：5/5
- 动画：4/4
- 可访问性：3/3
