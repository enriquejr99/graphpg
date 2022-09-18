import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../dist/esm/index.js'

test('multiple roots', () => {
  const graph = indedent`
  foo {
    bar(from: id, to: foo_id) {
      *
    }
  }
  bar {
    baz(from: id, to: bar_id) {
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
  ), cte_3 as (
      select
          baz.bar_id as k,
          json_agg(to_json(baz)) as v
      from baz
      group by baz.bar_id
  ), cte_4 as (
      select
          json_agg(json_build_object('baz', coalesce(cte_3.v, '[]'))) as v
      from bar
      left join cte_3 on bar.id = cte_3.k
  )
  select
      coalesce(cte_2.v, '[]') as foo,
      coalesce(cte_4.v, '[]') as bar
  from cte_2
  join cte_4 on true;`

  assert.strictEqual(graphpg(graph), sql)
})
