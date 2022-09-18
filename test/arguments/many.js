import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../../dist/esm/index.js'

test('many true', () => {
  const graph = indedent`
  foo {
    bar(from: id, to: foo_id, many: true) {
      *
    }
  }`

  const sql = indedent`
  with cte_1 as (
      select
          bar.foo_id as k,
          json_agg(to_json(bar)) as v
      from bar
      group by bar.foo_id
  ), cte_2 as (
      select
          json_agg(json_build_object('bar', coalesce(cte_1.v, '[]'))) as v
      from foo
      left join cte_1 on foo.id = cte_1.k
  )
  select
      coalesce(cte_2.v, '[]') as foo
  from cte_2;`

  assert.strictEqual(graphpg(graph), sql)
})

test('many false', () => {
  const graph = indedent`
  foo {
    bar(from: bar_id, to: id, many: false) {
      *
    }
  }`

  const sql = indedent`
  with cte_1 as (
      select
          bar.id as k,
          to_json(bar) as v
      from bar
  ), cte_2 as (
      select
          json_agg(json_build_object('bar', cte_1.v)) as v
      from foo
      left join cte_1 on foo.bar_id = cte_1.k
  )
  select
      coalesce(cte_2.v, '[]') as foo
  from cte_2;`

  assert.strictEqual(graphpg(graph), sql)
})
