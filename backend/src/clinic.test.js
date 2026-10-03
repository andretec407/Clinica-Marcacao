import test from 'node:test'
import assert from 'node:assert/strict'
import { validCpf } from './clinic.js'

test('validates a formatted Brazilian CPF', () => {
  assert.equal(validCpf('529.982.247-25'), true)
})

test('rejects repeated digits and invalid check digits', () => {
  assert.equal(validCpf('111.111.111-11'), false)
  assert.equal(validCpf('529.982.247-24'), false)
})
