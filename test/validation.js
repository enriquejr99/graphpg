import test from 'node:test'
import assert from 'node:assert'
import indedent from 'indedent'
import graphpg from '../dist/esm/index.js'

test('invalid argument', () => {
  const graph = indedent`
  foo(dog: true) {
    *
  }`

  assert.throws(() => graphpg(graph))
})

test('required argument', () => {
  const graph = indedent`
  foo {
    bar {
      *
    }
  }`

  assert.throws(() => graphpg(graph))
})

test('incompatible argument', () => {
  const graph = indedent`
  foo {
    bar(from: bar_id, to: id, many: false, order: "id desc") {
      *
    }
  }`

  assert.throws(() => graphpg(graph))
})

test('middle size', () => {
  const graph = indedent`
  foo {
    *
    foo_x_bar(from: id, to: foo_id, middle: true) {
      bar(from: bar_id, to: id, many: false) {
        *
      }
      baz(from: baz_id, to: id, many: false) {
        *
      }
    }
  }`

  assert.throws(() => graphpg(graph))
})

test('middle kind', () => {
  const graph = indedent`
  foo {
    *
    foo_x_bar(from: id, to: foo_id, middle: true) {
      id
    }
  }`

  assert.throws(() => graphpg(graph))
})
