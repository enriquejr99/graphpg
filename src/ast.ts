/*
Abstract syntax tree (AST) type definitions.
*/

export enum Kind {
  ROOT = 'root',
  OBJECT = 'object',
  FIELD = 'field',
}

export type Selection = RootSelection | ObjectSelection | FieldSelection

export type NestedSelection = ObjectSelection | FieldSelection

export interface RootSelection {
  kind: Kind.ROOT
  id: number
  name: string
  alias?: string
  arguments: RootArguments
  selections: NestedSelection[]
}

export interface ObjectSelection {
  kind: Kind.OBJECT
  id: number
  name: string
  alias?: string
  arguments: ObjectArguments
  selections: NestedSelection[]
}

export interface FieldSelection {
  kind: Kind.FIELD
  name: string
  alias?: string
  arguments: FieldArguments
}

export type Arguments = RootArguments | ObjectArguments | FieldArguments

export interface RootArguments {
  where?: string
  order?: string
  limit?: string
  offset?: string
}

export interface ObjectArguments extends RootArguments {
  from: string
  to: string
  join: string
  many: boolean
  middle: boolean
}

export interface FieldArguments {
  where?: string
}

export interface GQLDocumentNode {
  definitions: GQLDefinitionNode[]
}

export interface GQLDefinitionNode {
  selectionSet: GQLSelectionSetNode
}

export interface GQLSelectionSetNode {
  selections: GQLFieldNode[]
}

export interface GQLFieldNode {
  name: GQLNameNode
  alias?: GQLNameNode
  arguments?: GQLArgumentNode[]
  selectionSet?: GQLSelectionSetNode
}

export interface GQLNameNode {
  value: string
}

export interface GQLValueNode {
  value: string | boolean
}

export interface GQLArgumentNode {
  name: GQLNameNode
  value: GQLValueNode
}
