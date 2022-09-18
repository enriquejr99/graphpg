import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../../dist/esm/index.js'

test('root order', () => {
  const graph = indedent`
  foo(order: "id desc") {
    *
  }`

  const sql = indedent`
  with cte_1 as (
      select
          json_agg(to_json(foo) order by id desc) as v
      from foo
  )
  select
      coalesce(cte_1.v, '[]') as foo
  from cte_1;`

  assert.strictEqual(graphpg(graph), sql)
})

test('object order', () => {
  const graph = indedent`
  foo {
    bar(from: id, to: foo_id, order: "id desc") {
      *
    }
  }`

  const sql = indedent`
  with cte_1 as (
      select
          bar.foo_id as k,
          json_agg(to_json(bar) order by id desc) as v
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
