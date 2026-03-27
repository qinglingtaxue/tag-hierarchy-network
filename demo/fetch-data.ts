/**
 * 层级网络图数据获取脚本模板
 *
 * 使用方法：
 * 1. 复制此文件到你的项目
 * 2. 修改数据库连接和查询逻辑
 * 3. 运行: DATABASE_URL="..." npx ts-node fetch-data.ts
 * 4. 生成的 data.json 放到 index.html 同目录
 *
 * 或者直接在页面中设置:
 * <script>
 *   window.HIERARCHY_DATA = { nodes: [...], edges: [] };
 *   window.HIERARCHY_CONFIG = { title: '我的网络图', valueLabel: '频次' };
 * </script>
 */

import { writeFileSync } from 'fs'

// ========== 数据类型定义 ==========

interface HierarchyNode {
  id: string
  label: string
  value: number
  level: number
  parent: string | null
  metadata?: Record<string, any>
}

interface HierarchyData {
  nodes: HierarchyNode[]
  edges: { source: string; target: string; weight?: number }[]
}

interface Config {
  title: string
  valueLabel: string
  levels: { name: string; color: string }[]
  tips: string[]
  actionTemplate: string
}

// ========== 示例：从 PostgreSQL 获取标签层级数据 ==========

async function fetchFromPostgres(): Promise<HierarchyData> {
  // 示例：使用 @neondatabase/serverless
  // const { neon } = await import('@neondatabase/serverless')
  // const sql = neon(process.env.DATABASE_URL!)

  // 1. 查询节点频次
  // const nodes = await sql`
  //   SELECT tag as id, tag as label, COUNT(*) as value
  //   FROM videos, jsonb_array_elements_text(tags) AS tag
  //   WHERE tags IS NOT NULL
  //   GROUP BY tag
  //   ORDER BY value DESC
  //   LIMIT 100
  // `

  // 2. 查询共现关系
  // const cooccurrences = await sql`
  //   SELECT t1 as tag1, t2 as tag2, COUNT(*) as count
  //   FROM videos,
  //     jsonb_array_elements_text(tags) AS t1,
  //     jsonb_array_elements_text(tags) AS t2
  //   WHERE t1 < t2
  //   GROUP BY t1, t2
  //   HAVING COUNT(*) >= 3
  //   ORDER BY count DESC
  // `

  // 3. 构建层级（示例逻辑）
  // - 按频次分层：Top 10% = L0, Top 25% = L1, ...
  // - 按共现确定父子：子节点的父节点是与它共现最多的更高层级节点

  // 返回示例数据
  return {
    nodes: [
      { id: 'root1', label: '根节点1', value: 100, level: 0, parent: null },
      { id: 'child1', label: '子节点1', value: 50, level: 1, parent: 'root1' },
    ],
    edges: []
  }
}

// ========== 示例：从 API 获取数据 ==========

async function fetchFromAPI(): Promise<HierarchyData> {
  // const response = await fetch('https://your-api.com/hierarchy')
  // const data = await response.json()
  // return transformToHierarchy(data)

  return { nodes: [], edges: [] }
}

// ========== 示例：从本地文件/CSV 获取 ==========

async function fetchFromCSV(): Promise<HierarchyData> {
  // const csv = readFileSync('data.csv', 'utf-8')
  // const rows = csv.split('\n').map(row => row.split(','))
  // return transformCSVToHierarchy(rows)

  return { nodes: [], edges: [] }
}

// ========== 层级分配工具函数 ==========

function assignLevelsByValue(nodes: HierarchyNode[]): void {
  const sorted = [...nodes].sort((a, b) => b.value - a.value)
  const total = sorted.length

  sorted.forEach((node, i) => {
    const pct = i / total
    if (pct < 0.10) node.level = 0       // Top 10%
    else if (pct < 0.25) node.level = 1  // Top 25%
    else if (pct < 0.50) node.level = 2  // Top 50%
    else if (pct < 0.75) node.level = 3  // Top 75%
    else node.level = 4                   // Bottom 25%
  })
}

function assignParentsByCooccurrence(
  nodes: HierarchyNode[],
  cooccurrences: { tag1: string; tag2: string; count: number }[]
): void {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  // 对于每个非 L0 节点，找到与它共现最多的更高层级节点作为父节点
  nodes.forEach(node => {
    if (node.level === 0) return

    const candidates = cooccurrences.filter(c => {
      const other = c.tag1 === node.id ? c.tag2 : (c.tag2 === node.id ? c.tag1 : null)
      if (!other) return false
      const otherNode = nodeMap.get(other)
      return otherNode && otherNode.level === node.level - 1
    })

    if (candidates.length > 0) {
      const best = candidates.sort((a, b) => b.count - a.count)[0]
      node.parent = best.tag1 === node.id ? best.tag2 : best.tag1
    }
  })
}

function generateEdges(nodes: HierarchyNode[]): HierarchyData['edges'] {
  const edges: HierarchyData['edges'] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  nodes.forEach(node => {
    if (node.parent) {
      const parent = nodeMap.get(node.parent)
      if (parent && parent.level === node.level - 1) {
        edges.push({
          source: node.parent,
          target: node.id,
          weight: Math.min(node.value, parent.value)
        })
      }
    }
  })

  return edges
}

// ========== 主函数 ==========

async function main() {
  console.log('获取数据...')

  // 选择数据源（取消注释你需要的）
  const data = await fetchFromPostgres()
  // const data = await fetchFromAPI()
  // const data = await fetchFromCSV()

  // 如果没有预设层级，自动分配
  if (data.nodes.some(n => n.level === undefined)) {
    assignLevelsByValue(data.nodes)
  }

  // 自动生成边
  if (!data.edges || data.edges.length === 0) {
    data.edges = generateEdges(data.nodes)
  }

  // 验证数据
  const errors: string[] = []
  data.nodes.forEach(node => {
    if (node.parent) {
      const parent = data.nodes.find(n => n.id === node.parent)
      if (!parent) {
        errors.push(`节点 "${node.id}" 的父节点 "${node.parent}" 不存在`)
      } else if (parent.level !== node.level - 1) {
        errors.push(`节点 "${node.id}" (L${node.level}) 的父节点 "${node.parent}" 层级应为 L${node.level - 1}，实际为 L${parent.level}`)
      }
    }
  })

  if (errors.length > 0) {
    console.error('数据验证失败:')
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  }

  // 输出统计
  console.log(`\n统计:`)
  console.log(`  节点数: ${data.nodes.length}`)
  console.log(`  边数: ${data.edges.length}`)

  const levelCounts = [0, 0, 0, 0, 0]
  data.nodes.forEach(n => levelCounts[n.level]++)
  console.log(`  L0 (核心): ${levelCounts[0]}`)
  console.log(`  L1 (重要): ${levelCounts[1]}`)
  console.log(`  L2 (普通): ${levelCounts[2]}`)
  console.log(`  L3 (次要): ${levelCounts[3]}`)
  console.log(`  L4 (边缘): ${levelCounts[4]}`)

  // 写入文件
  writeFileSync('data.json', JSON.stringify(data, null, 2))
  console.log('\n✅ 已生成 data.json')

  // 可选：生成配置文件
  const config: Config = {
    title: '层级网络图',
    valueLabel: '频次',
    levels: [
      { name: 'L0 核心', color: 'hsl(45, 90%, 60%)' },
      { name: 'L1 重要', color: 'hsl(25, 80%, 58%)' },
      { name: 'L2 普通', color: 'hsl(200, 65%, 62%)' },
      { name: 'L3 次要', color: 'hsl(270, 50%, 68%)' },
      { name: 'L4 边缘', color: 'hsl(210, 30%, 55%)' },
    ],
    tips: ['悬停节点查看关系链', '节点越大 = 数值越高', '越靠近中心 = 层级越核心'],
    actionTemplate: '建议优先关注 "{root}" 相关内容',
  }
  writeFileSync('config.json', JSON.stringify(config, null, 2))
  console.log('✅ 已生成 config.json')
}

main().catch(console.error)
