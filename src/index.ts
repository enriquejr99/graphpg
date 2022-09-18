import { GQLDocumentNode, RootSelection } from './ast.js'
import { parse as gql } from './graphql/language/parser.js'
import { parse } from './parse.js'
import { write } from './write.js'

/**
 * Converts a graph to SQL.
 */

export function graphpg(graph: string) {
  graph = '{' + graph + '}'
  const tree = gql(graph) as unknown as GQLDocumentNode
  const roots = parse(tree.definitions[0].selectionSet.selections)
  const select = write(roots as RootSelection[])
  return select + ';'
}

export default graphpg
