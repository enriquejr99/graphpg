/*
Error messages.
*/

export const ARG_INVALID = (arg: string, selection: string) =>
  Error(`Invalid argument "${arg}" in "${selection}"`)

export const ARG_REQUIRED = (arg: string, selection: string) =>
  Error(`Missing required argument "${arg}" in "${selection}"`)

export const ARG_INCOMPATIBLE = (args: string[], selection: string) =>
  Error(`Cannot use "${args[0]}" with "${args[1]}" in "${selection}"`)

export const MIDDLE_SIZE = (selection: string) =>
  Error(`Expected only one selection in middle "${selection}"`)

export const MIDDLE_KIND = (selection: string) =>
  Error(`Expected a selection of kind "object" in middle "${selection}"`)
