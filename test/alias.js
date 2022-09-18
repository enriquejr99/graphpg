import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../dist/esm/index.js'

test('root alias', () => {
  const graph = indedent`
  dog: foo {
    *
  }`

  const sql = indedent`
  with cte_1 as (
      select
          json_agg(to_json(foo)) as v
      from foo
  )
  select
      coalesce(cte_1.v, '[]') as dog
  from cte_1;`

  assert.strictEqual(graphpg(graph), sql)
})

test('object alias', () => {
  const graph = indedent`
  foo {
    dog: bar(from: id, to: foo_id) {
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
          json_agg(json_build_object('dog', coalesce(cte_1.v, '[]'))) as v
      from foo
      left join cte_1 on foo.id = cte_1.k
  )
  select
      coalesce(cte_2.v, '[]') as foo
  from cte_2;`

  assert.strictEqual(graphpg(graph), sql)
})

test('field alias', () => {
  const graph = indedent`
  foo {
    dog: id
  }`

  const sql = indedent`
  with cte_1 as (
      select
          json_agg(json_build_object('dog', foo.id)) as v
      from foo
  )
  select
      coalesce(cte_1.v, '[]') as foo
  from cte_1;`

  assert.strictEqual(graphpg(graph), sql)
})
