import { Kind, Selection } from './ast.js'
import { schema } from './schema.js'
import * as errors from './errors.js'

/**
 * Validates the top-most selection.
 */

export function validate(selection: Selection) {
  const required = schema[selection.kind].required
  const optional = schema[selection.kind].optional
  const argNames = Object.keys(selection.arguments)

  for (const name of argNames) {
    if (!required.includes(name) && !optional.includes(name)) {
      throw errors.ARG_INVALID(name, selection.name)
    }
  }

  for (const name of required) {
    if (!argNames.includes(name)) {
      throw errors.ARG_REQUIRED(name, selection.name)
    }
  }

  if (selection.kind === Kind.OBJECT && !selection.arguments.many) {
    if (selection.arguments.order) {
      throw errors.ARG_INCOMPATIBLE(['order', 'many: false'], selection.name)
    }

    if (selection.arguments.limit) {
      throw errors.ARG_INCOMPATIBLE(['limit', 'many: false'], selection.name)
    }

    if (selection.arguments.offset) {
      throw errors.ARG_INCOMPATIBLE(['offset', 'many: false'], selection.name)
    }
  }

  if (selection.kind === Kind.OBJECT && selection.arguments.middle) {
    if (selection.selections.length !== 1) {
      throw errors.MIDDLE_SIZE(selection.name)
    }

    if (selection.selections[0].kind !== Kind.OBJECT) {
      throw errors.MIDDLE_KIND(selection.name)
    }
  }
}
