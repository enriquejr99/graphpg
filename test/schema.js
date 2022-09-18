import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../dist/esm/index.js'

test('root schema', () => {
  const graph = indedent`
  sch.foo {
    *
  }`

  const sql = indedent`
  with cte_1 as (
      select
          json_agg(to_json(sch.foo)) as v
      from sch.foo
  )
  select
      coalesce(cte_1.v, '[]') as foo
  from cte_1;`

  assert.strictEqual(graphpg(graph), sql)
})

test('object schema', () => {
  const graph = indedent`
  foo {
    sch.bar(from: id, to: foo_id) {
      *
    }
  }`

  const sql = indedent`
  with cte_1 as (
      select
          sch.bar.foo_id as k,
          json_agg(to_json(sch.bar)) as v
      from sch.bar
      group by sch.bar.foo_id
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
