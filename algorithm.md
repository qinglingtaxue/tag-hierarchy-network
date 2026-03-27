# 层级关系推断算法

> 用途：从任意实体-属性数据自动推导父子关系，构建层级网络图

---

## 核心概念

```
父节点 = 更通用的节点（频次/规模更高）
子节点 = 更具体的节点（频次/规模更低）
父子关系 = 基于共现和置信度推断
```

**适用数据类型**：
| 场景 | 实体 | 属性 | 示例 |
|------|------|------|------|
| 内容标签 | 视频/文章 | 标签 | 视频包含标签 ["健康","养生"] |
| 组织架构 | 员工 | 部门 | 员工属于部门 ["技术部","前端组"] |
| 产品分类 | 商品 | 类目 | 商品属于类目 ["电子","手机"] |
| 知识图谱 | 文档 | 概念 | 文档关联概念 ["AI","NLP"] |

---

## 输入契约（通用）

| 字段 | 类型 | 说明 |
|------|------|------|
| entity_id | string | 实体唯一 ID |
| attributes | array | 属性数组（标签/类目/概念等） |
| weight | number | 可选，实体权重（播放量/销售额等） |

**示例**：
```json
{ "entity_id": "video_001", "attributes": ["健康", "养生", "中医"], "weight": 10000 }
{ "entity_id": "product_001", "attributes": ["电子", "手机", "iPhone"], "weight": 5000 }
{ "entity_id": "doc_001", "attributes": ["AI", "机器学习", "NLP"], "weight": 100 }
```

---

## 计算口径

### 1. 属性清洗

```
- 小写化：lower(attr)
- 去前缀：去掉开头特殊符号（如 #）
- 去空格：trim
- 去停用词：高频虚词/平台词
- 最短长度：length(attr) >= 2
```

### 2. 频次定义

```
freq(node) = 包含该属性的去重实体数
保留阈值：freq >= MIN_FREQ
```

### 3. 共现定义

```
同一实体内任意属性对 (a,b)（a < b）记一次
co(a,b) = 同时包含 a,b 的去重实体数
保留阈值：co >= MIN_COOCCUR
```

### 4. 父子关系推断

```
对每个 child，在候选 parent 中选一条最佳父边：

候选条件：
  - parent != child
  - freq(parent) > freq(child)
  - co(parent, child) >= MIN_COOCCUR
  - P(parent|child) = co / freq(child) >= MIN_CONF

打分公式：
  score = conf + lexicalBonus + sizeBonus
  - lexicalBonus = 0.08（当 child includes parent 或反向）
  - sizeBonus <= 0.06（父频次比子频次高得越多，略加分）

每个 child 只保留 score 最大的一个 parent
```

### 5. 防环

```
追溯分支根时必须带 seen 集合防环
检测到环后立即中断追溯并保留当前节点为分支起点
```

---

## 推荐参数

| 参数 | 推荐值 | 说明 |
|------|-------|------|
| MIN_FREQ | 20 | 最小节点频率 |
| MIN_COOCCUR | 8 | 最小共现数 |
| MIN_CONF | 0.55 | 最小置信度 |
| MAX_NODES | 300 | 最大保留节点数 |

**调整建议**：
- 想更稳：提高 MIN_CONF（如 0.65）
- 想覆盖更多长尾：降低 MIN_FREQ（如 15），但图会更密
- 数据量小：降低 MIN_COOCCUR（如 3）

---

## SQL 实现（通用模板）

### A. 统计高频属性

```sql
-- 通用模板：替换 entities 和 attributes 为实际表/字段名
WITH expanded AS (
  SELECT
    e.id AS entity_id,
    lower(trim(attr)) AS attr
  FROM entities e,
    unnest(e.attributes) AS attr  -- 或 jsonb_array_elements_text
  WHERE e.is_deleted = FALSE
    AND e.attributes IS NOT NULL
)
SELECT attr, COUNT(DISTINCT entity_id)::int AS freq
FROM expanded
WHERE attr <> '' AND length(attr) >= 2
GROUP BY attr
HAVING COUNT(DISTINCT entity_id) >= $MIN_FREQ
ORDER BY freq DESC
LIMIT $MAX_NODES;
```

### B. 统计属性对共现

```sql
WITH expanded AS (
  SELECT
    e.id AS entity_id,
    lower(trim(attr)) AS attr
  FROM entities e,
    unnest(e.attributes) AS attr
  WHERE e.is_deleted = FALSE
    AND array_length(e.attributes, 1) >= 2
),
top_attrs AS (
  SELECT attr
  FROM expanded
  WHERE attr <> '' AND length(attr) >= 2
  GROUP BY attr
  HAVING COUNT(DISTINCT entity_id) >= $MIN_FREQ
  ORDER BY COUNT(DISTINCT entity_id) DESC
  LIMIT $MAX_NODES
),
filtered AS (
  SELECT e.entity_id, e.attr
  FROM expanded e
  JOIN top_attrs t ON t.attr = e.attr
)
SELECT
  f1.attr AS attr_a,
  f2.attr AS attr_b,
  COUNT(DISTINCT f1.entity_id)::int AS co
FROM filtered f1
JOIN filtered f2
  ON f1.entity_id = f2.entity_id
 AND f1.attr < f2.attr
GROUP BY f1.attr, f2.attr
HAVING COUNT(DISTINCT f1.entity_id) >= $MIN_COOCCUR;
```

### 场景示例：视频标签

```sql
-- videos 表，tags 字段为 JSONB 数组
WITH expanded AS (
  SELECT
    v.id AS entity_id,
    lower(trim(leading '#' from jsonb_array_elements_text(v.tags))) AS attr
  FROM videos v
  WHERE v.is_deleted = FALSE
    AND v.tags IS NOT NULL
    AND jsonb_array_length(v.tags) >= 1
)
-- ... 后续同通用模板
```

---

## Python 实现（父子关系推断）

```python
from typing import Dict, List, Tuple, Set

def infer_parent_child_relations(
    node_freq: Dict[str, int],
    node_cooccur: Dict[Tuple[str, str], int],
    min_conf: float = 0.55,
    min_cooccur: int = 8
) -> Dict[str, str]:
    """
    推断节点的父子关系

    Args:
        node_freq: 节点频次字典 {node: freq}
        node_cooccur: 节点共现字典 {(node_a, node_b): co}
        min_conf: 最小置信度
        min_cooccur: 最小共现数

    Returns:
        父子关系字典 {child: parent}
    """
    parent_map = {}

    for child, child_freq in node_freq.items():
        best_parent = None
        best_score = -1

        for (node_a, node_b), co in node_cooccur.items():
            # 确定哪个是候选父节点
            if node_a == child:
                parent_candidate = node_b
            elif node_b == child:
                parent_candidate = node_a
            else:
                continue

            parent_freq = node_freq.get(parent_candidate, 0)

            # 候选条件检查
            if parent_freq <= child_freq:
                continue
            if co < min_cooccur:
                continue

            conf = co / child_freq
            if conf < min_conf:
                continue

            # 计算分数
            lexical_bonus = 0.08 if (child in parent_candidate or parent_candidate in child) else 0
            size_bonus = min(0.06, (parent_freq - child_freq) / parent_freq * 0.1)
            score = conf + lexical_bonus + size_bonus

            if score > best_score:
                best_score = score
                best_parent = parent_candidate

        if best_parent:
            parent_map[child] = best_parent

    return parent_map


def find_branch_root(
    node: str,
    parent_map: Dict[str, str],
    seen: Set[str] = None
) -> str:
    """
    追溯分支根（带防环）

    Args:
        node: 起始节点
        parent_map: 父子关系映射
        seen: 已访问节点集合（用于防环）

    Returns:
        分支根节点
    """
    if seen is None:
        seen = set()

    current = node
    while current in parent_map:
        if current in seen:
            # 检测到环，返回当前节点
            return current
        seen.add(current)
        current = parent_map[current]

    return current


def assign_levels(parent_map: Dict[str, str]) -> Dict[str, int]:
    """
    分配层级（L0=根, L1, L2...）

    Returns:
        {node: level}
    """
    levels = {}

    # 找到所有根节点（没有父节点的）
    all_children = set(parent_map.keys())
    all_parents = set(parent_map.values())
    roots = all_parents - all_children

    # 根节点为 L0
    for root in roots:
        levels[root] = 0

    # BFS 分配层级
    def get_level(node: str, seen: Set[str] = None) -> int:
        if seen is None:
            seen = set()
        if node in levels:
            return levels[node]
        if node in seen:
            return 0  # 防环
        seen.add(node)
        parent = parent_map.get(node)
        if parent:
            levels[node] = get_level(parent, seen) + 1
        else:
            levels[node] = 0
        return levels[node]

    for node in all_children:
        get_level(node)

    return levels
```

---

## 输出契约（前端网络图）

```typescript
interface HierarchyNode {
  id: string          // 节点唯一ID
  label: string       // 显示名称
  value: number       // 频次/规模（用于节点大小）
  level: number       // 层级 0-4
  parent: string|null // 父节点ID
}

interface HierarchyEdge {
  source: string      // 父节点ID
  target: string      // 子节点ID
  weight: number      // 共现数（用于线宽）
}

interface HierarchyData {
  nodes: HierarchyNode[]
  edges: HierarchyEdge[]
}
```

---

## 常见故障与修复

| 故障 | 原因 | 修复 |
|------|------|------|
| 全图同色 | 只按根色，不做层级色阶 | 加层级明暗 |
| 白屏 | 追溯分支根时遇到环 | seen 防环 |
| 置信度 >100% | 口径不一致或重复计数 | 统一分母为 freq(child) |
| 层级错乱 | 跨级连接 | 确保 parent.level = child.level - 1 |

---

## 场景适配指南

| 场景 | entity | attributes | freq 含义 | 调参建议 |
|------|--------|------------|-----------|----------|
| 视频标签 | 视频 | 标签数组 | 使用次数 | MIN_FREQ=20 |
| 组织架构 | 员工 | 部门链 | 员工人数 | MIN_COOCCUR=3 |
| 产品分类 | 商品 | 类目路径 | SKU数量 | MIN_CONF=0.7 |
| 知识图谱 | 文档 | 概念列表 | 引用次数 | MIN_FREQ=10 |

---

> 可视化规范见 [SKILL.md](./SKILL.md)
