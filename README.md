# 层级网络图 (tag-hierarchy-network)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](SKILL.md)

通用层级网络图可视化组件，将任意父子层级数据转换为交互式径向网络图。

## 特性

- 弧形彗星尾布局
- 柔和层级配色（5 级）
- 族谱高亮（祖先→当前→后代）
- 边界限制拖拽
- 支持缩放/平移

## 适用场景

| 场景 | 示例 |
|------|------|
| 组织架构 | CEO → VP → 总监 → 经理 |
| 知识图谱 | 领域 → 分支 → 概念 |
| 产品分类 | 品类 → 子类 → SKU |
| 技能树 | 方向 → 技能 → 工具 |
| 标签体系 | 主题 → 话题 → 标签 |

## 快速开始

```bash
# 安装
42plugin install xiaosu/data-viz/tag-hierarchy-network

# 或从 GitHub 克隆
git clone https://github.com/qinglingtaxue/tag-hierarchy-network.git

# 或直接打开 demo
open demo/index.html
```

## 数据格式

```json
{
  "nodes": [
    { "id": "root", "label": "根节点", "value": 100, "level": 0, "parent": null },
    { "id": "child", "label": "子节点", "value": 50, "level": 1, "parent": "root" }
  ],
  "edges": []
}
```

## 文件结构

```
tag-hierarchy-network/
├── SKILL.md          # 主文档
├── README.md         # 说明文档
├── LICENSE           # MIT 许可证
├── algorithm.md      # 算法文档
├── VISUAL_SPEC.md    # 可视化规范
├── assets/           # 截图
└── demo/             # 可运行演示
    ├── index.html
    ├── schema.ts
    └── fetch-data.ts
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 作者

xiaosu
