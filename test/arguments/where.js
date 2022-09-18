import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../../dist/esm/index.js'

test('root where', () => {
  const graph = indedent`
  foo(where: "id > 10") {
    *
  }`

  const sql = indedent`
  with cte_1 as (
      select
          json_agg(to_json(foo)) as v
      from foo
      where id > 10
  )
  select
      coalesce(cte_1.v, '[]') as foo
  from cte_1;`

  assert.strictEqual(graphpg(graph), sql)
})

test('object where', () => {
  const graph = indedent`
  foo {
    bar(from: id, to: foo_id, where: "id > 10") {
      *
    }
  }`

  const sql = indedent`
  with cte_1 as (
      select
          bar.foo_id as k,
          json_agg(to_json(bar)) as v
      from bar
      where id > 10
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

test('field where', () => {
  const graph = indedent`
  foo {
    id(where: "id > 10")
  }`

  const sql = indedent`
  with cte_1 as (
      select
          json_agg(json_build_object('id', foo.id)) as v
      from foo
      where id > 10
  )
  select
      coalesce(cte_1.v, '[]') as foo
  from cte_1;`

  assert.strictEqual(graphpg(graph), sql)
})

test('multiple wheres', () => {
  const graph = indedent`
  foo(where: "id > 1") {
    id(where: "id > 2")
    bar(from: id, to: foo_id, where: "id > 3") {
      id(where: "id > 4")
    }
  }`

  const sql = indedent`
  with cte_1 as (
      select
          bar.foo_id as k,
          json_agg(json_build_object('id', bar.id)) as v
      from bar
      where (id > 3) and (id > 4)
      group by bar.foo_id
  ), cte_2 as (
      select
          json_agg(json_build_object('id', foo.id, 'bar', coalesce(cte_1.v, '[]'))) as v
      from foo
      left join cte_1 on foo.id = cte_1.k
      where (id > 1) and (id > 2)
  )
  select
      coalesce(cte_2.v, '[]') as foo
  from cte_2;`

  assert.strictEqual(graphpg(graph), sql)
})
