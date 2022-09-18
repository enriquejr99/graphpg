import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../../dist/esm/index.js'

test('many to many', () => {
  const graph = indedent`
  foo {
    *
    foo_x_bar(from: id, to: foo_id, middle: true) {
      bar(from: bar_id, to: id, many: false) {
        *
      }
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
          foo_x_bar.foo_id as k,
          json_agg(cte_1.v) as v
      from foo_x_bar
      left join cte_1 on foo_x_bar.bar_id = cte_1.k
      group by foo_x_bar.foo_id
  ), cte_3 as (
      select
          json_agg(to_jsonb(foo) || jsonb_build_object('bar', coalesce(cte_2.v, '[]'))) as v
      from foo
      left join cte_2 on foo.id = cte_2.k
  )
  select
      coalesce(cte_3.v, '[]') as foo
  from cte_3;`

  assert.strictEqual(graphpg(graph), sql)
})
