# Apple Notes Web - 改进计划

## 📋 当前状态

### 已完成功能
- ✅ 基础 UI 布局
- ✅ 创建、编辑、删除笔记
- ✅ 搜索功能
- ✅ 本地存储持久化
- ✅ 键盘快捷键
- ✅ 响应式设计

### 已知问题
- ⚠️ 按钮不够显眼
- ⚠️ 富文本编辑功能有限（仅支持基础 HTML）
- ⚠️ 单文件架构难以维护
- ⚠️ 缺少动画特效

---

## 🎯 改进路线图

### 第一阶段：UI/UX 优化（当前进行）

#### 1.1 按钮和交互优化
- [ ] 增大加号按钮尺寸（36px）
- [ ] 添加悬停动画和阴影
- [ ] 添加 tooltip 提示
- [ ] 优化删除模式视觉反馈

#### 1.2 动画和特效
- [ ] 添加页面切换过渡动画
- [ ] 添加笔记创建/删除动画
- [ ] 添加编辑器聚焦效果
- [ ] 添加按钮波纹效果（ripple）

#### 1.3 视觉层次
- [ ] 优化侧边栏折叠/展开动画
- [ ] 添加 Active 状态指示器
- [ ] 优化选中笔记的高亮效果
- [ ] 添加骨架屏加载效果

---

### 第二阶段：架构升级（下一步）

#### 2.1 采用 React 架构
```
apple-notes-web/
├── src/
│   ├── components/
│   │   ├── Sidebar/
│   │   ├── Editor/
│   │   ├── NoteList/
│   │   ├── Search/
│   │   └── Toolbar/
│   ├── hooks/
│   │   ├── useNotes.js
│   │   ├── useLocalStorage.js
│   │   └── useKeyboard.js
│   ├── context/
│   │   └── NotesContext.js
│   ├── utils/
│   │   ├── date.js
│   │   └── storage.js
│   ├── App.jsx
│   └── index.jsx
├── public/
│   └── index.html
├── package.json
└── vite.config.js
```

#### 2.2 富文本编辑器集成

##### 方案 A：TipTap（推荐）
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

**优点**：
- 基于 ProseMirror，业界认可
- 模块化设计，按需引入
- React 生态完善
- 社区活跃

##### 方案 B：Quill
```bash
npm install react-quill
```

**优点**：
- 配置简单
- 开箱即用
- 主题丰富

**缺点**：
- 定制性稍弱
- 体积较大

**推荐**：TipTap（更现代化）

---

### 第三阶段：功能增强

#### 3.1 富文本功能
- [ ] 标题（H1-H3）
- [ ] 粗体、斜体、下划线
- [ ] 有序/无序列表
- [ ] 代码块
- [ ] 引用块
- [ ] 分割线
- [ ] 链接
- [ ] 图片上传
- [ ] 检查清单（checklist）

#### 3.2 笔记管理
- [ ] 文件夹/标签系统
- [ ] 笔记排序（按日期、标题）
- [ ] 批量操作
- [ ] 笔记导出（PDF、Markdown）

#### 3.3 用户体验
- [ ] 笔记预览（hover 时显示）
- [ ] 自动保存指示器
- [ ] 撤销/重做支持
- [ ] 深色模式切换

---

### 第四阶段：测试和文档

#### 4.1 自动化测试
```bash
npm install -D vitest @testing-library/react @testing-library/user-event
```

- [ ] 单元测试（utils, hooks）
- [ ] 组件测试（Button, Editor, Sidebar）
- [ ] E2E 测试（Playwright）

#### 4.2 CI/CD
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npm run build
```

#### 4.3 文档
- [ ] API 文档
- [ ] 贡献指南
- [ ] 部署指南
- [ ] 设计规范

---

## 📅 实施计划

### Week 1：UI 优化
- [x] Day 1: 修复按钮问题
- [x] Day 2: 添加动画特效
- [x] Day 3: 优化视觉效果
- [x] Day 4: 本地测试
- [x] Day 5: 部署上线

### Week 2：React 重构
- [x] **Day 1**: 初始化 React + Vite 项目 ✅
- [x] **Day 2**: 迁移 Sidebar 组件 ✅
- [x] **Day 3**: 迁移 Editor 组件 ✅
- [x] **Day 4**: 集成 TipTap ✅
- [ ] Day 5: 测试和修复

### Week 3：功能增强
- [x] **Day 1**: 深色模式切换 ✅
- [x] **Day 2**: 键盘快捷键（Ctrl+N, Ctrl+B 等）✅
- [x] **Day 3**: 图片上传功能 ✅
- [x] **Day 4**: 链接功能 ✅
- [x] **Day 5**: 笔记导出（Markdown/PDF）✅（完成）

### Week 4：测试和文档
- [ ] Day 1-2: 单元测试
- [ ] Day 3: E2E 测试
- [ ] Day 4-5: 文档和部署

---

## 🎨 设计规范

### 颜色系统
```css
:root {
  /* Primary */
  --primary: #007AFF;
  --primary-hover: #0056b3;
  
  /* Background */
  --bg-sidebar: #F2F2F7;
  --bg-main: #FFFFFF;
  --bg-hover: rgba(0, 122, 255, 0.1);
  
  /* Text */
  --text-primary: #000000;
  --text-secondary: #8E8E93;
  --text-tertiary: #C7C7CC;
}
```

### 动画系统
```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
}

/* 页面切换 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 按钮波纹 */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}
```

---

## 🔧 技术栈

### 当前（Vanilla JS）
- HTML5, CSS3, ES6+
- LocalStorage
- ContentEditable

### 升级后（React）
- React 18
- Vite 5
- TipTap（富文本）
- Zustand 或 Context API（状态管理）
- React Router（路由）
- Vitest（测试）
- Playwright（E2E 测试）

---

## 📊 性能目标

- **首次内容绘制 (FCP)**: < 500ms
- **最大内容绘制 (LCP)**: < 1s
- **首次输入延迟 (FID)**: < 100ms
- **累积布局偏移 (CLS)**: < 0.1

---

## 💡 优化建议系统

每小时检查项目状态：

```javascript
// hourly-check.js
const checks = [
  { name: 'UI 完整性', test: () => checkAllComponentsExist() },
  { name: '交互响应', test: () => checkClickHandlers() },
  { name: '性能指标', test: () => checkPerformance() },
  { name: '代码质量', test: () => checkCodeSmells() }
];

// 每次测试后生成报告
```

---

## 🚀 部署策略

### 开发环境
```bash
npm run dev
# http://localhost:5173
```

### 测试环境
```bash
npm run build
npm run preview
# http://localhost:4173
```

### 生产环境
```bash
npm run build
# 部署到 Vercel
```

---

**最后更新**: 2026-02-07 01:20
**维护者**: Gary
