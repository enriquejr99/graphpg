import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../../dist/esm/index.js'

test('one to many', () => {
  const graph = indedent`
  foo {
    *
    bar(from: id, to: foo_id) {
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
          json_agg(to_jsonb(foo) || jsonb_build_object('bar', coalesce(cte_1.v, '[]'))) as v
      from foo
      left join cte_1 on foo.id = cte_1.k
  )
  select
      coalesce(cte_2.v, '[]') as foo
  from cte_2;`

  assert.strictEqual(graphpg(graph), sql)
})
