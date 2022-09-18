import { Kind, RootSelection, ObjectSelection, FieldSelection } from './ast.js'
import * as sql from './sql.js'

/**
 * Writes an SQL SELECT statement.
 */

export function write(roots: RootSelection[]) {
  let ctes: string[] = []
  let joins: string[] = []
  let columns: string[] = []

  for (const root of roots) {
    ctes.push(...writeCTE(root))
    columns.push(
      sql.as({
        item: sql.func({
          name: 'coalesce',
          args: [
            sql.column({
              column: 'v',
              table: `cte_${root.id}`,
            }),
            "'[]'",
          ],
        }),
        as: root.alias ?? root.name,
      })
    )
  }

  for (const root of roots.slice(1)) {
    joins.push(
      sql.join({
        join: `cte_${root.id}`,
        on: 'true',
      })
    )
  }

  const select = sql.select({
    ctes: ctes,
    columns: columns,
    from: `cte_${roots[0].id}`,
    joins: joins,
  })

  return select
}

/**
 * Writes a common table expression (CTE) from a selection.
 */

function writeCTE(selection: RootSelection | ObjectSelection) {
  const nestedObjects = selection.selections.filter(
    (ns) => ns.kind === Kind.OBJECT
  ) as ObjectSelection[]
  const nestedFields = selection.selections.filter(
    (ns) => ns.kind === Kind.FIELD
  ) as FieldSelection[]

  if (selection.kind === Kind.OBJECT && selection.arguments.middle) {
    const rightObject = nestedObjects[0]
    selection.alias = selection.alias ?? rightObject.alias ?? rightObject.name
  }

  let ctes: string[] = []
  for (const nestedObject of nestedObjects) {
    ctes.push(...writeCTE(nestedObject))
  }

  let columns: string[] = []
  if (selection.kind === Kind.OBJECT) {
    const keyColumn = writeKeyColumn(selection)
    columns.push(keyColumn)
  }
  const valueColumn = writeValueColumn(selection)
  columns.push(valueColumn)

  let joins: string[] | undefined
  for (const nestedObject of nestedObjects) {
    const from = sql.column({
      column: nestedObject.arguments.from,
      table: selection.name,
    })
    const to = sql.column({
      column: 'k',
      table: `cte_${nestedObject.id}`,
    })
    const on = sql.equal({
      a: from,
      b: to,
    })
    const join = sql.join({
      type: nestedObject.arguments.join,
      join: `cte_${nestedObject.id}`,
      on: on,
    })
    if (!joins) joins = []
    joins.push(join)
  }

  let where: string | undefined
  let wheres: string[] = []
  for (const s of [selection, ...nestedFields]) {
    if (s.arguments.where) {
      wheres.push(s.arguments.where)
    }
  }
  if (wheres.length === 1) {
    where = sql.where({
      where: wheres[0],
    })
  } else if (wheres.length > 1) {
    where = sql.where({
      where: sql.and({
        parts: wheres.map((w) =>
          sql.bracket({
            content: w,
          })
        ),
      }),
    })
  }

  let group: string | undefined
  if (selection.kind === Kind.OBJECT && selection.arguments.many) {
    group = sql.group({
      column: sql.column({
        column: selection.arguments.to,
        table: selection.name,
      }),
    })
  }

  let order: string | undefined
  if (
    selection.kind === Kind.OBJECT &&
    selection.arguments.order &&
    !selection.arguments.many
  ) {
    order = sql.order({
      order: selection.arguments.order,
    })
  }

  const select = sql.select({
    columns: columns,
    from: selection.name,
    joins: joins,
    where: where,
    group: group,
    order: order,
  })

  const cte = sql.as({
    item: `cte_${selection.id}`,
    as: sql.bracket({
      content: select,
      tall: true,
    }),
  })

  ctes.push(cte)
  return ctes
}

/**
 * Writes the key "k" column of a CTE.
 */

function writeKeyColumn(selection: ObjectSelection) {
  const column = sql.as({
    item: sql.column({
      column: selection.arguments.to,
      table: selection.name,
    }),
    as: 'k',
  })
  return column
}

/**
 * Writes the value "v" column of a CTE.
 */

function writeValueColumn(selection: RootSelection | ObjectSelection) {
  const isAll = selection.selections.some((ns) => ns.name === '*')
  const isAgg = selection.kind === Kind.ROOT || selection.arguments.many
  const isArr = selection.arguments.limit || selection.arguments.offset
  const isMid = selection.kind === Kind.OBJECT && selection.arguments.middle

  let args: string[] = []
  for (const ns of selection.selections) {
    let value: string
    if (isAll && ns.kind === Kind.FIELD) {
      continue
    } else if (ns.kind === Kind.FIELD) {
      value = sql.column({
        column: ns.name,
        table: selection.name,
      })
    } else if (ns.kind === Kind.OBJECT && !ns.arguments.many) {
      value = sql.column({
        column: 'v',
        table: `cte_${ns.id}`,
      })
    } else {
      value = sql.func({
        name: 'coalesce',
        args: [
          sql.column({
            column: 'v',
            table: `cte_${ns.id}`,
          }),
          "'[]'",
        ],
      })
    }
    args.push(ns.alias ? `'${ns.alias}'` : `'${ns.name}'`)
    args.push(value)
  }

  let column: string
  if (isMid) {
    column = args[1]
  } else if (isAll && !args.length) {
    column = sql.func({
      name: 'to_json',
      args: [selection.name],
    })
  } else if (!isAll && args.length) {
    column = sql.func({
      name: 'json_build_object',
      args: args,
    })
  } else {
    column = sql.concatenate({
      parts: [
        sql.func({
          name: 'to_jsonb',
          args: [selection.name],
        }),
        sql.func({
          name: 'jsonb_build_object',
          args: args,
        }),
      ],
    })
  }

  if (isAgg && selection.arguments.order) {
    column += ' ' + sql.order({ order: selection.arguments.order })
  }

  let slice: string | undefined
  if (isArr) {
    const offset = selection.arguments.offset
      ? parseInt(selection.arguments.offset) + 1
      : 1
    const limit = selection.arguments.limit
      ? offset + parseInt(selection.arguments.limit) - 1
      : ''
    slice = `[${offset}:${limit}]`
  }

  if (isArr) {
    column = sql.func({
      name: 'to_json',
      args: [
        sql.bracket({
          content: sql.func({
            name: 'array_agg',
            args: [column],
          }),
        }) + slice,
      ],
    })
  } else if (isAgg) {
    column = sql.func({
      name: 'json_agg',
      args: [column],
    })
  }

  column = sql.as({
    item: column,
    as: 'v',
  })

  return column
}
