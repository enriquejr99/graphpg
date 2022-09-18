import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../../dist/esm/index.js'

test('self reference', () => {
  const graph = indedent`
  foo {
    *
    foo(from: id, to: id, many: false) {
      *
    }
  }`

  const sql = indedent`
  with cte_1 as (
      select
          foo.id as k,
          to_json(foo) as v
      from foo
  ), cte_2 as (
      select
          json_agg(to_jsonb(foo) || jsonb_build_object('foo', cte_1.v)) as v
      from foo
      left join cte_1 on foo.id = cte_1.k
  )
  select
      coalesce(cte_2.v, '[]') as foo
  from cte_2;`

  assert.strictEqual(graphpg(graph), sql)
})
