import {BehaviorSubject} from 'rxjs/BehaviorSubject'
import {createCompositeSubject} from '../createCompositeSubject'
import {createNodeProps} from '../createNodeProps'
import {createObservableFromArray} from '../createObservableFromArray'

import 'rxjs/add/operator/skip'

describe(`createCompositeSubject`, () => {
  it(`ends subscriptions`, () => {
    const subject = createCompositeSubject(createNodeProps)({hidden: true})

    subject.subscribe()

    assert.equal(subject.isUnsubscribed, false)

    subject.unsubscribe()

    assert.equal(subject.isUnsubscribed, true)
  })

  it(`does not propegate values after it has been unsubscribed`, () => {
    const hidden = new BehaviorSubject(true)
    const subject = createCompositeSubject(createNodeProps)({hidden})
    const error = new Error(`ER MER GERD!`)

    const subscription = subject.skip(1).subscribe(() => {throw error})

    assert.throws(() => hidden.next(false))
    subscription.unsubscribe()
    assert.doesNotThrow(() => hidden.next(true), error)
  })

  describe(`createNodeProps`, () => {
    it(`creates a subject that unwraps an object of observables`, done => {
      const height = new BehaviorSubject(12)
      const hidden = new BehaviorSubject(true)
      const className = `gabe gabe gabe`
      const subject =
        createCompositeSubject(createNodeProps)({height, hidden, className})

      subject.subscribe(props => {
        assert.equal(props.height, 12)
        assert.equal(props.hidden, true)
        assert.equal(props.className, `gabe gabe gabe`)
        done()
      })
    })
  })

  describe(`createObservableFromArray`, () => {
    it(`creates a subject that unwraps an array of observables`, done => {
      const height = new BehaviorSubject(12)
      const hidden = new BehaviorSubject(true)
      const className = `gabe gabe gabe`
      const subject = createCompositeSubject(createObservableFromArray)([height, hidden, className])

      subject.subscribe(props => {
        assert.equal(props[0], 12)
        assert.equal(props[1], true)
        assert.equal(props[2], `gabe gabe gabe`)
        done()
      })
    })
  })
})
