/**
 * 层级网络图通用数据格式
 *
 * 适用场景：
 * - 标签/话题层级关系
 * - 组织架构图
 * - 分类树状结构
 * - 任何父子层级数据
 */

// ========== 核心数据结构 ==========

export interface HierarchyNode {
  id: string           // 唯一标识
  label: string        // 显示名称
  value: number        // 数值（决定节点大小）
  level: number        // 层级 0=核心, 1=重要, 2=普通, 3=次要, 4=边缘
  parent: string | null // 父节点 ID（null 表示根节点）
  metadata?: Record<string, any> // 扩展字段（如 avgViews, category 等）
}

export interface HierarchyEdge {
  source: string       // 父节点 ID
  target: string       // 子节点 ID
  weight?: number      // 边权重（可选，影响线条粗细）
}

export interface HierarchyData {
  nodes: HierarchyNode[]
  edges: HierarchyEdge[]
}

// ========== 配置项 ==========

export interface LevelConfig {
  name: string         // 层级名称（如 "核心话题"）
  color: string        // HSL 颜色（如 "hsl(45, 90%, 60%)"）
}

export interface VisualizationConfig {
  title?: string                    // 图表标题
  levels?: LevelConfig[]            // 层级配置（默认 5 级）
  valueLabel?: string               // 数值字段名称（如 "频次"、"人数"）
  tips?: string[]                   // 提示文案
  actionTemplate?: string           // 行动建议模板，{root} 会被替换
}

// ========== 默认配置 ==========

export const DEFAULT_LEVELS: LevelConfig[] = [
  { name: 'L0 核心', color: 'hsl(45, 90%, 60%)' },   // 金色
  { name: 'L1 重要', color: 'hsl(25, 80%, 58%)' },   // 橙色
  { name: 'L2 普通', color: 'hsl(200, 65%, 62%)' },  // 蓝色
  { name: 'L3 次要', color: 'hsl(270, 50%, 68%)' },  // 紫色
  { name: 'L4 边缘', color: 'hsl(210, 30%, 55%)' },  // 灰蓝
]

export const DEFAULT_CONFIG: VisualizationConfig = {
  title: '层级网络图',
  levels: DEFAULT_LEVELS,
  valueLabel: '数值',
  tips: [
    '悬停节点查看关系链',
    '节点越大 = 数值越高',
    '越靠近中心 = 层级越核心',
  ],
  actionTemplate: '建议优先关注 "{root}" 相关内容',
}

// ========== 数据验证 ==========

export function validateData(data: HierarchyData): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const nodeIds = new Set(data.nodes.map(n => n.id))

  // 检查节点
  data.nodes.forEach((node, i) => {
    if (!node.id) errors.push(`节点 ${i}: 缺少 id`)
    if (!node.label) errors.push(`节点 ${node.id}: 缺少 label`)
    if (typeof node.value !== 'number') errors.push(`节点 ${node.id}: value 必须是数字`)
    if (typeof node.level !== 'number' || node.level < 0) errors.push(`节点 ${node.id}: level 必须是非负整数`)

    // 检查父节点存在性
    if (node.parent && !nodeIds.has(node.parent)) {
      errors.push(`节点 ${node.id}: 父节点 "${node.parent}" 不存在`)
    }

    // 检查层级连续性
    if (node.parent) {
      const parent = data.nodes.find(n => n.id === node.parent)
      if (parent && parent.level !== node.level - 1) {
        errors.push(`节点 ${node.id}: 层级 ${node.level} 的父节点层级应为 ${node.level - 1}，实际为 ${parent.level}`)
      }
    }
  })

  return { valid: errors.length === 0, errors }
}

// ========== 自动生成边 ==========

export function generateEdges(nodes: HierarchyNode[]): HierarchyEdge[] {
  const edges: HierarchyEdge[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  nodes.forEach(node => {
    if (node.parent) {
      const parent = nodeMap.get(node.parent)
      if (parent && parent.level === node.level - 1) {
        edges.push({
          source: node.parent,
          target: node.id,
          weight: Math.min(node.value, parent.value),
        })
      }
    }
  })

  return edges
}
