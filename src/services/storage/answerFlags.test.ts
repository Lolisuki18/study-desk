// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { getAllAnswerFlags, getAnswerFlag, replaceAllAnswerFlags, setAnswerFlag } from './answerFlags'

describe('answer flags', () => {
  beforeEach(() => replaceAllAnswerFlags({}))

  it('sets, reads and clears a verdict', () => {
    setAnswerFlag('c::q1', 'suspect')
    expect(getAnswerFlag('c::q1')?.status).toBe('suspect')
    setAnswerFlag('c::q1', 'verified')
    expect(getAnswerFlag('c::q1')?.status).toBe('verified')
    setAnswerFlag('c::q1', null)
    expect(getAnswerFlag('c::q1')).toBeUndefined()
  })

  it('persists across a reload of the module cache (localStorage)', () => {
    setAnswerFlag('c::q2', 'suspect')
    expect(JSON.parse(localStorage.getItem('psh.answer_flags')!)['c::q2'].status).toBe('suspect')
  })

  it('restores from a backup and drops entries that are not valid flags', () => {
    replaceAllAnswerFlags({ 'c::a': { status: 'verified', at: 'x' }, 'c::b': { status: 'bogus' as never, at: 'y' }, 'c::c': null as never })
    expect(Object.keys(getAllAnswerFlags())).toEqual(['c::a'])
  })
})
