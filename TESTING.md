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
