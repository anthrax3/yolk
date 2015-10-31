const h = require(`yolk-virtual-dom/h`)
const create = require(`yolk-virtual-dom/create-element`)
const wrapObject = require(`./wrapObject`)
const addProperties = require(`./addProperties`)

function YolkCustomComponent () {}

YolkCustomComponent.prototype = {
  type: `Widget`,
  onMount () {},
  onUpdate () {},
  onUnmount () {},

  _initialize (props, children) {
    this._props = props

    switch (children.length) {
    case 1:
      this._child = children[0]
      break
    case 0:
      this._child = h(`div`)
      break
    default:
      throw new Error(`${this.constructor.name} may not have more than one child`)
    }
  },

  init () {
    const node = create(this._child)
    const props$ = wrapObject(this._props)
    const mountDisposable = props$.take(1).subscribe(props => this.onMount(props, node))
    const updateDisposable = props$.skip(1).subscribe(props => this.onUpdate(props, node))

    this._onDestroy = () => {
      mountDisposable.dispose()
      updateDisposable.dispose()
    }

    return node
  },

  predestroy (node) {
    this.onUnmount(node)
  },

  destroy () {
    this._onDestroy && this._onDestroy()
  },
}

YolkCustomComponent._isCustomComponent = true

YolkCustomComponent.create = function createInstance (props, children) {
  const instance = new this(props, children)
  instance._initialize(props, children)

  return instance
}

YolkCustomComponent.extend = function extend (obj) {
  function Component () {}
  Component.prototype = Object.create(YolkCustomComponent.prototype)
  addProperties(Component.prototype, obj)

  return Component
}

module.exports = YolkCustomComponent
