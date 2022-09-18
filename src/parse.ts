import { schema } from './schema.js'
import { validate } from './validation.js'
import {
  Kind,
  Selection,
  NestedSelection,
  RootArguments,
  ObjectArguments,
  FieldArguments,
  GQLFieldNode,
} from './ast.js'

/**
 * Simplifies the original GraphQL AST.
 */

export function parse(
  nodes: GQLFieldNode[],
  id: number = 0,
  isRoot: boolean = true
) {
  let selections: Selection[] = []

  for (const node of nodes) {
    let kind: Kind
    if (isRoot) {
      kind = Kind.ROOT
    } else if (node.selectionSet) {
      kind = Kind.OBJECT
    } else {
      kind = Kind.FIELD
    }

    const name = node.name.value

    let alias: string | undefined
    if (node.alias) {
      alias = node.alias.value
    } else if (name.includes('.')) {
      alias = name.split('.')[1]
    }

    let args = { ...schema[kind].defaults }
    if (node.arguments) {
      for (const arg of node.arguments) {
        const name = arg.name.value
        const value = arg.value.value
        // @ts-ignore
        args[name] = value
      }
    }

    let nestedSelections: NestedSelection[] = []
    if (node.selectionSet) {
      const nestedNodes = node.selectionSet.selections
      nestedSelections = parse(nestedNodes, id, false) as NestedSelection[]
      const ids = nestedSelections.map((ns) => ('id' in ns ? ns.id : 0))
      id = Math.max(...ids, id)
    }

    let selection: Selection
    if (kind === Kind.ROOT) {
      selection = {
        kind: kind,
        id: ++id,
        name: name,
        alias: alias,
        arguments: args as RootArguments,
        selections: nestedSelections,
      }
    } else if (kind === Kind.OBJECT) {
      selection = {
        kind: kind,
        id: ++id,
        name: name,
        alias: alias,
        arguments: args as ObjectArguments,
        selections: nestedSelections,
      }
    } else {
      selection = {
        kind: kind,
        name: name,
        alias: alias,
        arguments: args as FieldArguments,
      }
    }

    validate(selection)
    selections.push(selection)
  }

  return selections
}
