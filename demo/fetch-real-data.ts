/**
 * 从数据库获取真实标签数据并构建层级结构
 *
 * 运行: npx ts-node fetch-real-data.ts
 */

import { neon } from '@neondatabase/serverless'

// 从环境变量获取数据库连接
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('请设置 DATABASE_URL 环境变量')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

interface TagCooccurrence {
  tag1: string
  tag2: string
  count: number
}

interface TagFrequency {
  tag: string
  count: number
  avg_views: number
}

async function main() {
  console.log('连接数据库...')

  // 1. 查询标签频次（Top 100）
  console.log('\n=== 标签频次 Top 20 ===')
  const tagFreqs = await sql`
    SELECT
      tag,
      COUNT(*) as count,
      AVG(view_count)::integer as avg_views
    FROM videos,
      jsonb_array_elements_text(tags) AS tag
    WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 100
  ` as TagFrequency[]

  console.log('标签\t\t频次\t平均播放')
  tagFreqs.slice(0, 20).forEach(t => {
    console.log(`${t.tag.padEnd(12)}\t${t.count}\t${t.avg_views}`)
  })

  // 2. 查询标签共现（同一视频中出现的标签对）
  console.log('\n=== 标签共现 Top 30 ===')
  const cooccurrences = await sql`
    WITH tag_pairs AS (
      SELECT
        t1 as tag1,
        t2 as tag2,
        COUNT(*) as count
      FROM videos v,
        jsonb_array_elements_text(v.tags) AS t1,
        jsonb_array_elements_text(v.tags) AS t2
      WHERE t1 < t2
        AND v.tags IS NOT NULL
        AND jsonb_array_length(v.tags) > 1
      GROUP BY t1, t2
      HAVING COUNT(*) >= 3
    )
    SELECT * FROM tag_pairs
    ORDER BY count DESC
    LIMIT 100
  ` as TagCooccurrence[]

  console.log('标签1\t\t标签2\t\t共现次数')
  cooccurrences.slice(0, 30).forEach(c => {
    console.log(`${c.tag1.padEnd(12)}\t${c.tag2.padEnd(12)}\t${c.count}`)
  })

  // 3. 构建层级结构（基于共现聚类）
  console.log('\n=== 构建层级结构 ===')

  // 按频次分配层级
  const levels: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] }
  const tagToLevel: Record<string, number> = {}

  tagFreqs.forEach((t, i) => {
    const pct = i / tagFreqs.length
    const level = pct < 0.1 ? 0 : pct < 0.25 ? 1 : pct < 0.5 ? 2 : pct < 0.75 ? 3 : 4
    levels[level].push(t.tag)
    tagToLevel[t.tag] = level
  })

  console.log('Level 0 (核心):', levels[0].slice(0, 5).join(', '))
  console.log('Level 1 (重要):', levels[1].slice(0, 5).join(', '))
  console.log('Level 2 (普通):', levels[2].slice(0, 5).join(', '))
  console.log('Level 3 (次要):', levels[3].slice(0, 5).join(', '))
  console.log('Level 4 (边缘):', levels[4].slice(0, 5).join(', '))

  // 4. 建立父子关系（基于共现）
  console.log('\n=== 层级关系示例 ===')
  const parentMap: Record<string, string> = {}

  // 对于每个非核心标签，找到与它共现最多的更高层级标签作为父节点
  for (let lvl = 1; lvl <= 4; lvl++) {
    levels[lvl].forEach(childTag => {
      // 找到与这个标签共现的所有更高层级标签
      const candidates = cooccurrences.filter(c =>
        (c.tag1 === childTag && tagToLevel[c.tag2] !== undefined && tagToLevel[c.tag2] < lvl) ||
        (c.tag2 === childTag && tagToLevel[c.tag1] !== undefined && tagToLevel[c.tag1] < lvl)
      )

      if (candidates.length > 0) {
        // 选择共现次数最多的作为父节点
        const best = candidates.sort((a, b) => b.count - a.count)[0]
        const parent = best.tag1 === childTag ? best.tag2 : best.tag1
        parentMap[childTag] = parent
      }
    })
  }

  // 打印一些层级关系示例
  Object.entries(parentMap).slice(0, 20).forEach(([child, parent]) => {
    console.log(`${parent} (Level ${tagToLevel[parent]}) → ${child} (Level ${tagToLevel[child]})`)
  })

  // 5. 输出为 JSON 格式（可直接用于可视化）
  console.log('\n=== 导出数据 ===')
  const exportData = {
    nodes: tagFreqs.slice(0, 50).map(t => ({
      id: t.tag,
      label: t.tag,
      freq: t.count,
      avgViews: t.avg_views,
      level: tagToLevel[t.tag],
      parent: parentMap[t.tag] || null
    })),
    edges: cooccurrences
      .filter(c => tagToLevel[c.tag1] !== undefined && tagToLevel[c.tag2] !== undefined)
      .slice(0, 100)
      .map(c => ({
        source: c.tag1,
        target: c.tag2,
        weight: c.count
      }))
  }

  console.log(JSON.stringify(exportData, null, 2))
}

main().catch(console.error)
