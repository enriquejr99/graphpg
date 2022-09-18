import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../../dist/esm/index.js'

test('root limit', () => {
  const graph = indedent`
  foo(limit: 10) {
    *
  }`

  const sql = indedent`
  with cte_1 as (
      select
          to_json((array_agg(to_json(foo)))[1:10]) as v
      from foo
  )
  select
      coalesce(cte_1.v, '[]') as foo
  from cte_1;`

  assert.strictEqual(graphpg(graph), sql)
})

test('object limit', () => {
  const graph = indedent`
  foo {
    bar(from: id, to: foo_id, limit: 10) {
      *
    }
  }`

  const sql = indedent`
  with cte_1 as (
      select
          bar.foo_id as k,
          to_json((array_agg(to_json(bar)))[1:10]) as v
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

test('limit zero', () => {
  const graph = indedent`
  foo(limit: 0) {
    *
  }`

  const sql = indedent`
  with cte_1 as (
      select
          to_json((array_agg(to_json(foo)))[1:0]) as v
      from foo
  )
  select
      coalesce(cte_1.v, '[]') as foo
  from cte_1;`

  assert.strictEqual(graphpg(graph), sql)
})
