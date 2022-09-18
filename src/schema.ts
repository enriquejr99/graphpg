/*
Arguments schema.
*/

export const schema = {
  root: {
    required: [] as string[],
    optional: ['where', 'order', 'limit', 'offset'],
    defaults: {},
  },
  object: {
    required: ['from', 'to'],
    optional: ['join', 'many', 'middle', 'where', 'order', 'limit', 'offset'],
    defaults: { join: 'left', many: true, middle: false },
  },
  field: {
    required: [] as string[],
    optional: ['where'],
    defaults: {},
  },
}
