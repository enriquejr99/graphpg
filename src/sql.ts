import indedent from 'indedent'

/*
SQL helper functions.
*/

interface AndOptions {
  parts: string[]
}

export function and({ parts }: AndOptions) {
  if (parts.length > 1) {
    return parts.join(' and ')
  } else {
    return parts[0]
  }
}

interface AsOptions {
  item: string
  as: string
}

export function as({ item, as }: AsOptions) {
  if (as) {
    return `${item} as ${as}`
  } else {
    return item
  }
}

interface BracketOptions {
  content: string
  tall?: boolean
  long?: boolean
}

export function bracket({ content, tall, long }: BracketOptions) {
  if (tall) {
    return indedent`
    (
        ${content}
    )`
  } else if (long) {
    return `( ${content} )`
  } else {
    return `(${content})`
  }
}

interface ColumnOptions {
  column: string
  table?: string
}

export function column({ column, table }: ColumnOptions) {
  if (table) {
    return `${table}.${column}`
  } else {
    return column
  }
}

interface ConcatenateOptions {
  parts: string[]
}

export function concatenate({ parts }: ConcatenateOptions) {
  if (parts.length > 1) {
    return parts.join(' || ')
  } else {
    return parts[0]
  }
}

interface EqualOptions {
  a: string
  b: string
}

export function equal({ a, b }: EqualOptions) {
  return `${a} = ${b}`
}

interface FuncOptions {
  name: string
  args?: string[]
}

export function func({ name, args }: FuncOptions) {
  if (args && args.length) {
    return `${name}(${args.join(', ')})`
  } else {
    return `${name}()`
  }
}

interface GroupOptions {
  column: string
}

export function group({ column }: GroupOptions) {
  return `group by ${column}`
}

interface JoinOptions {
  type?: string
  join: string
  on: string
}

export function join({ type, join, on }: JoinOptions) {
  if (type) {
    return `${type} join ${join} on ${on}`
  } else {
    return `join ${join} on ${on}`
  }
}

interface LimitOptions {
  limit: string
}

export function limit({ limit }: LimitOptions) {
  return `limit ${limit}`
}

interface OffsetOptions {
  offset: string
}

export function offset({ offset }: OffsetOptions) {
  return `offset ${offset}`
}

interface OrderOptions {
  order: string
  sort?: string
}

export function order({ order, sort }: OrderOptions) {
  if (sort) {
    return `order by ${order} ${sort}`
  } else {
    return `order by ${order}`
  }
}

interface SelectOptions {
  ctes?: string[]
  columns: string[]
  from: string
  joins?: string[]
  group?: string
  where?: string
  order?: string
  limit?: string
  offset?: string
}

export function select({
  ctes,
  columns,
  from,
  joins,
  where,
  group,
  order,
  limit,
  offset,
}: SelectOptions) {
  const c = ctes ? `with ${ctes.join(', ')}` : ''
  const j = joins ? joins.join('\n') : undefined
  const x = [j, where, group, order, limit, offset].filter((x) => x).join('\n')
  return indedent`
  ${c}
  select
      ${columns.join(',\n')}
  from ${from}
  ${x}`
}

interface WhereOptions {
  where: string
}

export function where({ where }: WhereOptions) {
  return `where ${where}`
}
