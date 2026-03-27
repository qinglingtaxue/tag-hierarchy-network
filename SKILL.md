---
name: tag-hierarchy-network
description: >-
  生成径向层级网络图，将父子层级数据转换为交互式可视化，用于分析层级关系和发现核心节点。适用于组织架构、知识图谱、产品分类、技能树、标签体系等场景，支持族谱高亮、弧形布局、拖拽缩放。
metadata:
  author: xiaosu
  version: 1.0.0
  title: 层级网络图
  description_zh: 通用径向层级网络图，弧形布局，支持任意父子层级数据可视化
  license: MIT
  homepage: https://github.com/qinglingtaxue/tag-hierarchy-network
  repository: https://github.com/qinglingtaxue/tag-hierarchy-network
  keywords:
    - 可视化
    - 层级网络
    - 数据分析
    - 组织架构
    - 知识图谱
  category: visualization
  tags:
    - data-viz
    - hierarchy
    - network-graph
    - interactive
---

# 层级网络图

## Overview

通用的层级网络图可视化组件，将**任意父子层级数据**渲染为交互式径向网络图。

**适用数据类型**：
| 场景 | 节点示例 | 层级关系 |
|------|----------|----------|
| 组织架构 | CEO → VP → 总监 → 经理 | 汇报关系 |
| 知识图谱 | 领域 → 分支 → 概念 → 术语 | 包含关系 |
| 产品分类 | 品类 → 子类 → 系列 → SKU | 归属关系 |
| 技能树 | 领域 → 方向 → 技能 → 子技能 | 依赖关系 |
| 标签体系 | 主题 → 话题 → 标签 → 子标签 | 共现关系 |
| 文件目录 | 根目录 → 文件夹 → 子文件夹 | 包含关系 |

**核心特性**：弧形彗星尾布局、柔和层级配色、族谱高亮、边界限制拖拽。

## When to Use

**适用场景：**
- 展示任意层级结构的网络关系（最多 5 层）
- 需要暗色风格的径向簇状网络图
- 需要交互式探索父子关系
- 数据量 50-300 节点

**不适用：**
- 无层级的平面网络（改用力导向图）
- 需要精确语义关系（改用知识图谱工具）
- 超大规模数据（>500 节点，性能下降）

---

## Usage

**快速开始**（< 1 分钟）：
1. 打开 `demo/index.html`
2. 查看示例网络图
3. 替换 `data.json` 为你的数据

**完整流程**：见下方 [使用方式](#使用方式)

---

## 场景调用指南

### 场景 1：组织架构图

**数据来源**：HR 系统、企业微信/飞书通讯录

**层级定义**：
| Level | 含义 | 示例 |
|-------|------|------|
| L0 | C-Level | CEO、CTO、CFO |
| L1 | VP/总监 | 技术VP、产品总监 |
| L2 | 经理 | 前端经理、后端经理 |
| L3 | 组长 | React组长、Node组长 |
| L4 | 成员 | 工程师 |

**数据示例**：
```json
{
  "nodes": [
    { "id": "ceo", "label": "CEO", "value": 500, "level": 0, "parent": null },
    { "id": "cto", "label": "CTO", "value": 120, "level": 1, "parent": "ceo" },
    { "id": "fe-mgr", "label": "前端经理", "value": 30, "level": 2, "parent": "cto" }
  ]
}
```

**value 含义**：团队人数 或 管辖范围

---

### 场景 2：产品分类树

**数据来源**：电商后台、ERP 系统

**层级定义**：
| Level | 含义 | 示例 |
|-------|------|------|
| L0 | 一级品类 | 电子产品、服装、食品 |
| L1 | 二级品类 | 手机、电脑、平板 |
| L2 | 三级品类 | iPhone、Android |
| L3 | 系列 | iPhone 15 系列 |
| L4 | SKU | iPhone 15 Pro Max 256G |

**数据示例**：
```json
{
  "nodes": [
    { "id": "electronics", "label": "电子产品", "value": 5000000, "level": 0, "parent": null },
    { "id": "phone", "label": "手机", "value": 3000000, "level": 1, "parent": "electronics" },
    { "id": "iphone", "label": "iPhone", "value": 1500000, "level": 2, "parent": "phone" }
  ]
}
```

**value 含义**：销售额 或 SKU 数量

---

### 场景 3：知识图谱

**数据来源**：Wiki、文档系统、知识库

**层级定义**：
| Level | 含义 | 示例 |
|-------|------|------|
| L0 | 领域 | 人工智能、Web开发 |
| L1 | 分支 | 机器学习、深度学习 |
| L2 | 概念 | CNN、RNN、Transformer |
| L3 | 技术 | BERT、GPT、LLaMA |
| L4 | 工具 | HuggingFace、LangChain |

**数据示例**：
```json
{
  "nodes": [
    { "id": "ai", "label": "人工智能", "value": 1000, "level": 0, "parent": null },
    { "id": "ml", "label": "机器学习", "value": 500, "level": 1, "parent": "ai" },
    { "id": "nlp", "label": "NLP", "value": 200, "level": 2, "parent": "ml" }
  ]
}
```

**value 含义**：关联文档数 或 学习人数

---

### 场景 4：技能树

**数据来源**：培训系统、学习平台

**层级定义**：
| Level | 含义 | 示例 |
|-------|------|------|
| L0 | 职业方向 | 前端、后端、数据 |
| L1 | 核心技能 | JavaScript、Python |
| L2 | 框架 | React、Vue、FastAPI |
| L3 | 进阶 | Hooks、SSR、异步 |
| L4 | 工具库 | Zustand、TanStack |

**数据示例**：
```json
{
  "nodes": [
    { "id": "frontend", "label": "前端开发", "value": 10000, "level": 0, "parent": null },
    { "id": "js", "label": "JavaScript", "value": 8000, "level": 1, "parent": "frontend" },
    { "id": "react", "label": "React", "value": 5000, "level": 2, "parent": "js" }
  ]
}
```

**value 含义**：学习人数 或 岗位需求数

---

### 场景 5：内容标签体系

**数据来源**：CMS、视频平台、社交媒体

**层级定义**：
| Level | 含义 | 示例 |
|-------|------|------|
| L0 | 主题 | 健康、科技、娱乐 |
| L1 | 话题 | 养生、AI、游戏 |
| L2 | 标签 | 中医、ChatGPT、王者 |
| L3 | 子标签 | 穴位、Prompt、英雄 |
| L4 | 长尾 | 足三里、CoT、李白 |

**数据示例**：
```json
{
  "nodes": [
    { "id": "tech", "label": "科技", "value": 5000, "level": 0, "parent": null },
    { "id": "ai", "label": "AI", "value": 3000, "level": 1, "parent": "tech" },
    { "id": "chatgpt", "label": "ChatGPT", "value": 1500, "level": 2, "parent": "ai" }
  ]
}
```

**value 含义**：使用频次 或 内容数量

---

### 通用调用步骤

```bash
# 1. 准备数据文件
cat > data.json << 'EOF'
{
  "nodes": [
    { "id": "root", "label": "根节点", "value": 100, "level": 0, "parent": null },
    { "id": "child", "label": "子节点", "value": 50, "level": 1, "parent": "root" }
  ],
  "edges": []
}
EOF

# 2. 放到 demo 目录
cp data.json /path/to/demo/

# 3. 打开浏览器
open /path/to/demo/index.html
```

### 配置自定义

```javascript
// 在 HTML 中设置自定义配置
window.HIERARCHY_CONFIG = {
  title: '我的组织架构',           // 图表标题
  valueLabel: '团队人数',          // 数值标签
  levels: [
    { name: 'C-Level', color: 'hsl(45, 70%, 58%)' },
    { name: '总监', color: 'hsl(200, 45%, 70%)' },
    { name: '经理', color: 'hsl(140, 40%, 60%)' },
    { name: '组长', color: 'hsl(210, 35%, 75%)' },
    { name: '成员', color: 'hsl(220, 25%, 80%)' },
  ],
  actionTemplate: '核心部门: "{root}"',
};
```

---

## Output

生成的可视化包含：
- **径向层级网络图**（HTML 页面）- 弧形彗星尾布局
- **核心发现面板** - 前 3 个热门分支的层级汇总
- **交互功能** - 缩放、拖拽、族谱高亮

**输出示例**：
```text
┌────────────────────────────────────────┐
│            ⭐ 核心节点 (L0)              │
│         ╱         │         ╲          │
│      ◉ L1      ◉ L1      ◉ L1         │
│     ╱  ╲       │        ╱   ╲         │
│   ○ L2  ○ L2  ○ L2    ○ L2  ○ L2     │
│   │           │                       │
│  · L3        · L3      （彗星尾扩散）   │
└────────────────────────────────────────┘
```

---

## 使用方式

### 方式 A：纯前端（URL 参数 / JS 变量）

**1. URL 参数加载**
```text
index.html?data=my-data.json
```

**2. 全局变量加载**
```html
<script>
  // 示例：组织架构
  window.HIERARCHY_DATA = {
    nodes: [
      { id: "ceo", label: "CEO", value: 100, level: 0, parent: null },
      { id: "cto", label: "CTO", value: 80, level: 1, parent: "ceo" },
      { id: "dev-lead", label: "开发主管", value: 60, level: 2, parent: "cto" },
    ],
    edges: []  // 可选，会自动根据 parent 生成
  };

  window.HIERARCHY_CONFIG = {
    title: '组织架构图',
    valueLabel: '团队规模',
    levels: [
      { name: 'C-Level', color: 'hsl(45, 70%, 58%)' },
      { name: 'VP/Director', color: 'hsl(200, 45%, 70%)' },
      { name: 'Manager', color: 'hsl(140, 40%, 60%)' },
    ],
    actionTemplate: '核心决策层: "{root}"',
  };
</script>
<script src="index.html"></script>
```

**3. 同目录 data.json**
```text
demo/
├── index.html
└── data.json    ← 自动加载
```

### 方式 B：数据库获取

```bash
# 1. 复制脚本模板
cp fetch-data.ts my-project/

# 2. 修改数据源和查询逻辑

# 3. 运行生成数据
DATABASE_URL="postgresql://..." npx ts-node fetch-data.ts

# 4. 生成的 data.json 放到 index.html 同目录
```

---

## 数据格式

### 节点 (nodes)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 唯一标识 |
| label | string | ✅ | 显示名称 |
| value | number | ✅ | 数值（决定节点大小） |
| level | number | ✅ | 层级 0-4（0=核心，4=边缘） |
| parent | string\|null | ✅ | 父节点 ID（根节点为 null） |
| metadata | object | | 扩展字段 |

### 边 (edges) - 可选

| 字段 | 类型 | 说明 |
|------|------|------|
| source | string | 父节点 ID |
| target | string | 子节点 ID |
| weight | number | 边权重（可选） |

> 如果不提供 edges，会自动根据 parent 字段生成。

### 层级规则

**严格相邻层级连接**：
- Level 0 的 parent 必须是 null
- Level 1 的 parent 必须是 Level 0 节点
- Level 2 的 parent 必须是 Level 1 节点
- ...

---

## Quick Reference

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| MIN_FREQ | 20 | 最小节点数值 |
| MIN_COOCCUR | 8 | 最小共现数（构建层级用） |
| MAX_NODES | 100-300 | 最大节点数 |

> 详细算法见 [algorithm.md](./algorithm.md)

---

## 可视化规范

**核心特性**：
- 弧形彗星尾布局（同一分支沿弧线扩散）
- 径向层级分布（核心 L0 在中心，边缘 L4 在外围）
- 柔和层级配色（柔金 → 浅蓝 → 浅绿 → 灰蓝）
- 节点边界限制（30px 边距，防止超出画布）

**交互**：
- ✅ 滚轮缩放 / 按钮缩放
- ✅ 拖拽平移 / 节点拖拽
- ✅ hover 族谱高亮（祖先→当前→后代）

**层级连接**：严格相邻（L0→L1→L2→L3→L4），禁止跨级。

> 详细规范见 [VISUAL_SPEC.md](./VISUAL_SPEC.md)

---

## 核心发现面板

### UI 布局

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 💡 核心发现                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ 🥇 【第一分支】                                                      │
│    根节点："技术部"（规模 87 人）                                     │
│    二级：开发（54人）、测试（23人）...等 5 个                         │
│    三级：前端（28人）、后端（18人）...等 8 个                         │
│    → 最大的组织分支                                                  │
│                                                                     │
│ 🥈 【第二分支】...                                                   │
│ 🥉 【第三分支】...                                                   │
│                                                                     │
│ 📊 网络共 5 个独立分支，87 个节点存在层级关系                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 显示规则

1. **最多显示 3 个分支**（按根节点数值排序）
2. **二级节点**：显示前 5 个 + 总数
3. **三级节点**：显示前 3-5 个 + 总数
4. **第一分支**额外显示行动建议
5. **底部统计**：分支总数 + 层级节点数

### 数据结构

```typescript
interface CoreFindings {
  categories: BranchSummary[]  // 最多 3 个
  totalBranches: number        // 独立分支数
  totalHierarchyNodes: number  // 存在层级关系的节点数
}

interface BranchSummary {
  medal: string           // 🥇 🥈 🥉
  rootNode: string        // 根节点名称
  rootValue: number       // 根节点数值
  level2Nodes: { label: string; value: number }[]
  level3Nodes: { label: string; value: number }[]
}
```

---

## 数值含义说明

根据不同场景，`value` 字段含义不同：

| 场景 | value 含义 | 示例 |
|------|-----------|------|
| 组织架构 | 团队人数 | CEO: 500, CTO: 120 |
| 产品分类 | 销售额/SKU数 | 电子产品: 1000万 |
| 知识图谱 | 关联文档数 | AI: 500篇 |
| 标签体系 | 使用频次 | 健康: 877次 |
| 技能树 | 学习人数 | Python: 10000人 |

---

## 验收清单

### 网络图

- [ ] 弧形布局：同一分支沿弧线扩散（彗星尾效果）
- [ ] 径向层级：核心标签（L0）在中心，边缘标签（L4）在外围
- [ ] 层级颜色：柔金(L0) → 浅蓝(L1) → 浅绿(L2) → 灰蓝(L3) → 浅灰蓝(L4)
- [ ] 严格相邻连接：无跨层级连线（L0 不能直连 L3）
- [ ] hover 族谱高亮：显示完整祖先+后代链
- [ ] 节点可单独拖拽（边界限制）
- [ ] 节点不超出画布边界（30px 边距）
- [ ] 可缩放平移：不卡死、可重置
- [ ] 背景星星 + 中心发光圆环

### 核心发现面板

- [ ] 显示最多 3 个分类（按根标签频次排序）
- [ ] 每个分类显示一级、二级、三级话题
- [ ] 第一类显示行动建议
- [ ] 底部显示分支总数和层级话题数

---

## Resources

### Demo 文件

| 文件 | 说明 |
|------|------|
| [demo/index.html](./demo/index.html) | 可视化组件（可直接打开） |
| [demo/schema.ts](./demo/schema.ts) | TypeScript 类型定义 |
| [demo/fetch-data.ts](./demo/fetch-data.ts) | 数据获取脚本模板 |

### 规范文档

- [algorithm.md](./algorithm.md) — 计算口径、SQL、Python 实现
- [VISUAL_SPEC.md](./VISUAL_SPEC.md) — 可视化规范详细文档

### 示例截图

| 文件 | 说明 |
|------|------|
| `assets/01-network-full.jpg` | 完整网络图 |

### 独立演示

- [demo/index.html](./demo/index.html) — 可直接打开的独立网页演示

