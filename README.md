# GraphPG

Tool for querying a [PostgreSQL](https://www.postgresql.org/) database with graphs. Lighter and faster than [Hasura](https://hasura.io/) and [PostGraphile](https://www.graphile.org/).

# Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Graph](#graph)
  - [Anatomy](#anatomy)
  - [Arguments](#arguments)
  - [Schemas](#schemas)
  - [Aliases](#aliases)
  - [Filters](#filters)
  - [Nesting](#nesting)
- [Performance](#performance)

# Install

Use `npm` to install the latest version.

```
npm i graphpg
```

# Usage

The `graphpg` function converts a graph string to an SQL `SELECT` statement. Learn how to write graphs in the [graph](#graph) section below.

```js
import graphpg from 'graphpg'
// or
const { graphpg } = require('graphpg')

const graph = `foo { * }`

const sql = graphpg(graph)

console.log(sql)
```

```
with cte_1 as (
    select
        json_agg(to_json(foo)) as v
    from foo
)
select
    coalesce(cte_1.v, '[]') as foo
from cte_1;
```

# Graph

Basic knowledge of [GraphQL](https://graphql.org/) is recommended however, this specification does not follow the GraphQL specification.

### Anatomy

The graph structure is similar to that of a GraphQL [query](https://graphql.org/learn/queries/), without the root-level curly braces. Graphs are made up of `objects` and `fields`. An object represents a table, while fields represent columns of a table. The top-most object is a special kind of object known as the `root` object, of which there can be many.

```
foo {                          // root
  *                            // field
}
bar {                          // root
  id                           // field
  baz(from: id, to: bar_id) {  // object
    id                         // field
    bar_id                     // field
  }
}
```

### Arguments

Table of arguments. Optional and required arguments are marked with one `✓` and two `✓✓` checkmarks respectively.

|        | Description        | Default | Root | Object | Field |
| ------ | ------------------ | :-----: | :--: | :----: | :---: |
| Where  | SQL `WHERE`        |         |  ✓   |   ✓    |   ✓   |
| Order  | SQL `ORDER BY`     |         |  ✓   |   ✓    |       |
| Limit  | SQL `LIMIT`        |         |  ✓   |   ✓    |       |
| Offset | SQL `OFFSET`       |         |  ✓   |   ✓    |       |
| From   | Parent join column |         |      |   ✓✓   |       |
| To     | Nested join column |         |      |   ✓✓   |       |
| Join   | Join type          |  left   |      |   ✓    |       |
| Many   | Returns many rows? |  true   |      |   ✓    |       |
| Middle | Is junction table? |  false  |      |   ✓    |       |

### Schemas

To select a table from a particular database [schema](https://www.postgresql.org/docs/current/ddl-schemas.html), write the schema and table name separated by a dot.

```
animal.dog {
  *
}
```

### Aliases

To rename a key in the returned JSON object, use an alias as shown below. Here `breed` is an alias of the `type` column.

```
dog {
  name
  breed: type
}
```

### Filters

To select only those records that match certain criteria, SQL `WHERE`, `ORDER BY`, `LIMIT` and `OFFSET` clauses are supported.

```
dog(where: "color = black", order: "age desc", limit: 10) {
  *
}
```

### Nesting

Nesting an object is the equivalent of an SQL `JOIN` clause. Just like SQL `JOIN` clauses, nesting requires a join condition. The join condition is built using the required object arguments `from` and `to`, where `from` is a column in the parent object and `to` is a column in the nested object. In most cases these are primary and foreign key columns.

By default, tables are `LEFT` joined unless the `join` argument is specified. All PostgreSQL join types are supported.

When dealing with one-to-one or many-to-one relationships, using `many: false` will return a single object instead of an array of objects. In addition, when dealing with a many-to-many relationship the middle (i.e. junction) table can be omitted from the returned JSON object by specifying `middle: true`.

```
dog {
  name
  age
  owner(from: owner_id, to: id, many: false) {
    name
  }
}
```

# Performance

The generated SQL has been carefully designed to be simple and computationally cost-effective. Query plan [analysis](https://www.postgresql.org/docs/current/using-explain.html) shows our generated SQL `SELECT` statements have a significantly lower total cost and take less time to compute than those of [Hasura](https://hasura.io/) and [PostGraphile](https://www.graphile.org/).
