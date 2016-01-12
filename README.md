<h1>Yolk <img src="https://avatars3.githubusercontent.com/u/15056177?v=3&s=50" alt="https://twitter.com/patdryburgh" /></h1>

[![Join the chat at https://gitter.im/yolkjs/yolk](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/yolkjs/yolk?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![circle-ci](https://circleci.com/gh/garbles/yolk/tree/master.png?style=shield)](https://circleci.com/gh/garbles/yolk)
[![npm version](https://badge.fury.io/js/yolk.svg)](https://badge.fury.io/js/yolk)

__Rewrite in progress!!!__ While most of the API for Yolk will remain the same, it is currently being rewritten to accomodate various internal improvements that need to be made. [You can follow along here](https://github.com/garbles/yolk/pull/67). :neckbeard:

Anyway...

A library for building asynchronous user interfaces.

* __Familiar__: Yolk is a small library built on top of [Virtual DOM](https://github.com/Matt-Esch/virtual-dom) and [RxJS](https://github.com/Reactive-Extensions/RxJS). It exposes a very limited API so that you don't have to spend weeks getting up to speed. Yolk components are just plain functions that return JSX or hyperscript.

* __Everything is an observable__: Yolk components consume RxJS observable streams as if they were plain values. From a websocket connection to a generator function to an event handler. If it can be represented as an observable, then it can be rendered directly into your markup.

* __Stateless__: Being able to describe user interactions, control flow and plain values as observable streams means that application design becomes entirely declarative. There is no need to manually subscribe to observables in order to mutate or set component state.

Also see the [Yolk organization](https://github.com/yolkjs) for additional repositories.

## Example

The following example renders a component with buttons to increment and decrement a counter.

```js
import { h, render } from 'yolk'

function Counter ({props, children, createEventHandler}) {

  // map all plus button click events to 1
  const handlePlus = createEventHandler()
  const plusOne$ = handlePlus.map(() => 1)

  // map all minus button click events to -1
  const handleMinus = createEventHandler()
  const minusOne$ = handleMinus.map(() => -1)

  // merge both event streams together and keep a running count of the result
  const count$ = plusOne$.merge(minusOne$).scan((x, y) => x + y, 0).startWith(0)

  // prop keys are always cast as observables
  const title$ = props.title.map(title => `Awesome ${title}`)

  return (
    <div>
      <h1>{title$}</h1>
      <div>
        <button id="plus" onClick={handlePlus}>+</button>
        <button id="minus" onClick={handleMinus}>-</button>
      </div>
      <div>
        <span>Count: {count$}</span>
      </div>
      {children}
    </div>
  )
}

render(<Counter title="Example" />, document.getElementById('container'))
```

Additionally, see the Yolk implementation of [TodoMVC](https://github.com/yolkjs/yolk-todomvc) or [The Flux Challenge](https://github.com/staltz/flux-challenge/tree/master/submissions/garbles).

## API

The Yolk API is intentionally very limited so that you don't have to spend weeks getting up to speed. With an understanding of [RxJS](https://github.com/Reactive-Extensions/RxJS), you can begin building with Yolk immediately.

### Instance API

Yolk components inject a single object as an argument. The object has three keys: `props`, `children`, and `createEventHandler`.

##### `props: Object<Observable>`

An object who's keys are the props passed into the component. These props are wrapped in observables.
Yolk supports infinite nesting of observable properties, so it doesn't matter whether you pass in a plain
value or a Subject of Subjects, the result will be an observable of plain values. We do this intentionally
so that components are less dependent on the scenario which they are consumed.

```js
import { h, render } from 'yolk'

function MyComponent({props}) {
  return <h1>{props.title}</h1>
}

// both of the following will render the same result

// render MyComponent with an observable as the title prop
const title$ = new Rx.BehaviorSubject("Hello!")
render(<MyComponent title={title$} />, document.querySelector(`#container`))

// render MyComponent with a plain value as the title prop
render(<MyComponent title="Hello!" />, document.querySelector(`#container`))
```

##### `children: Observable`

An observable of the children passed to a component.

```js
import { h, render } from 'yolk'

function MyComponent({children}) {
  return <p>{children}</p>
}

render(
  <MyComponent><strong>HELLO!</strong><span>world...</span></MyComponent>,
  document.querySelector(`#container`)
)
// renders <p><strong>HELLO!</strong><span>world...</span></p>
```

##### `createEventHandler(mapping: any, initialValue: any): Function`

Creates an exotic function that can also be used as an observable. If the function is called, the input value is pushed to the observable as it's latest value.
In other words, when this function is used as an event handler, the result is an observable stream of events from that handler. For example,

```js
import { h, render } from 'yolk'

function MyComponent ({createEventHandler}) {
  // create an event handler
  const handleClick = createEventHandler()

  // use event handler to count the number of clicks
  const numberOfClicks =
    handleClick.scan((acc, ev) => acc + 1, 0).startWith(0)

  // create an element that displays the number of clicks
  // and a button to increment it
  return (
    <div>
      <span>Number of clicks: {numberOfClicks}</span>
      <button onClick={handleClick}>Click me!</button>
    </div>
  )
}
```

When custom components are destroyed, we want to make sure that all of our event handlers are properly cleaned up.

### Top Level API

##### `render(instance: Component, node: HTMLElement): Component`

Renders an instance of a YolkComponent inside of an HTMLElement.

```js
import { render } from 'yolk'
render(<span>Hello World!</span>, document.getElementById('container'))
```

##### `h(component: string|Function , [props: Object<any>], [...children: Array<any>]): Component`

If you prefer hyperscript over JSX, Yolk exposes a function `h` which can be used to write your components with hyperscript.
`h` also parses tags for brevity. For example, `p.my-class` will append a `my-class` class to a `p` tag, `#some-id` will
append a `some-id` id to a `div` tag.

```js
import { h } from 'yolk'

function MyComponent ({createEventHandler}) {
  const handleClick = createEventHandler()

  const numberOfClicks =
    handleClick.scan((acc, ev) => acc + 1, 0).startWith(0)

  return h(`.my-counter-component`, {},
    h(`span#counter`, {}, `Number of clicks: `, numberOfClicks),
    h(`button#clicker`, {onClick: handleClick}, `Click me!`)
  )
}
```

##### `registerElement(name: string, fn: Function): void`

Registers a [custom HTML element](http://www.html5rocks.com/en/tutorials/webcomponents/customelements/) using `document.registerElement` (polyfill included).
This is especially useful if you're not building a single page application. For example,

```js
import { h, registerElement } from 'yolk'
function BigRedText ({props}) {
  return <h1 style={{color: 'red'}}>{props.content}</h1>
}

registerElement(`big-red-text`, BigRedText)
```

will allow you to use `<big-red-text content="Hello!"></big-red-text>` in your `.html` files and will render out to

```html
<big-red-text content="Hello!">
  <h1 style="color: red;">Hello!</h1>
</big-red-text>
```

##### `CustomComponent`

Yolk.CustomComponent makes it easy to wrap non-Yolk behavior as a component, e.g. jQuery plugin or React component.
Each component expects three (optional) methods,

- `onMount(props: object, node: HTMLElement): void`
- `onUpdate(props: object, node: HTMLElement): void`
- `onUnmount (node: HTMLElement): void`

These methods pass in the latest values of your props so that you don't need to deal with subscribing to and disposing of Observables. For example,

```js
import { CustomComponent } from 'yolk'
class MyjQueryWrapper extends CustomComponent {
  onMount (props, node) {
    this._instance = $(node).myjQueryThing(props)
  }

  onUpdate (props, node) {
    this._instance.update(props)
  }

  onUnmount () {
    this._instance.destroy()
  }
}
```

And then in your component markup,

```js
import { h } from 'yolk'
function MyComponent ({createEventHandler}) {
  const handleClick = createEventHandler()

  return (
    <div>
      <MyjQueryWrapper onClick={handleClick} />
    </div>
  )
}
```

CustomComponent expects a single child element to use as the node; otherwise, it will default to an empty `div`.
For example, you can specify the child like so,

```js
import { h } from 'yolk'

function MyComponent ({createEventHandler}) {
  const handleClick = createEventHandler()

  return (
    <div>
      <MyjQueryWrapper onClick={handleClick}>
        <ul className="my-child-node">
          <li>Point 1</li>
          <li>Point 2</li>
          <li>Point 3</li>
        </ul>
      </MyjQueryWrapper>
    </div>
  )
}
```

## Using JSX

It is highly suggested that you write Yolk with JSX. This is achieved using the [Babel transpiler](http://babeljs.io/) (version 6+). You should install your `babel` tool of choice (e.g., `babel-cli` or `babel-loader`) and `babel-plugin-transform-react-jsx` and configure the `pragma` option for `transform-react-jsx`.

Run:

```sh
npm i --save-dev babel-cli babel-plugin-transform-react-jsx
```

`.babelrc`:

```json
{
  "plugins": [
    ["transform-react-jsx", {"pragma": "h"}]
  ]
}
```

Then anywhere you use JSX it will be transformed into plain JavaScript. For example this,

```js
<p>My JSX</p>
```

Turns into,

```js
h(
  "p",
  null,
  "My JSX"
);
```

Without this pragma, Babel will assume that you mean to write JSX for React and you will receive `React is undefined` errors.

If you want to additionally transpile ES2015 code into ES5 code you should install and use `babel-preset-es2015`:

```json
{
  "presets": ["es2015"],
  "plugins": [
    ["transform-react-jsx", {"pragma": "h"}]
  ]
}
```

See [`yolk-todomvc`](https://github.com/yolkjs/yolk-todomvc) for a complete working example.

## Support for Immutable Objects and #toJS

Yolk will not attempt to 'unwrap' objects that have a `toJS` function defined on them. This method is only called when a plain
value is required to render something. It is particularly useful when used with libraries like
[Immutable.js](https://github.com/facebook/immutable-js/) or [Freezer.js](https://github.com/arqex/freezer).

## Supported Events

Yolk supports the following list of standard browser events,

```
onAbort onBlur onCancel onCanPlay onCanPlayThrough onChange onClick
onCompositionStart onCompositionUpdate onCompositionEnd onContextMenu onCopy
onCueChange onCut onDblClick onDrag onDragEnd onDragEnter onDragExit onDragLeave onDragOver
onDragStart onDrop onDurationChange onEmptied onEnded onEncypted onError onFocus onInput
onInvalid onKeyDown onKeyPress onKeyUp onLoad onLoadedData onLoadedMetaData onLoadStart
onMouseDown onMouseEnter onMouseLeave onMouseMove onMouseOut onMouseOver onMouseUp
onPaste onPause onPlay onPlaying onProgress onRateChange onReset onResize onScroll onSearch
onSeeked onSeeking onSelect onShow onStalled onSubmit onSuspend onTimeUpdate onTouchCancel
onTouchEnd onTouchMove onTouchStart onToggle onVolumeChange onWaiting onWheel
```

In addition, Yolk supports the following custom browser events,

```
onMount onUnmount
```

## Supported Attributes

Yolk supports the following list of standard element attributes,

```
accept acceptCharset accessKey action align alt async autoComplete autoFocus autoPlay
autoSave bgColor border cite className color colSpan content
contentEditable coords default defer dir dirName draggable dropZone
encType for headers height hidden href hrefLang httpEquiv icon id isMap
itemProp keyType kind label lang max method min name noValidate open
optimum pattern ping placeholder poster preload radioGroup rel
required reversed rowSpan sandbox scope span spellCheck src srcLang start
step style summary tabIndex target title type useMap wrap allowFullScreen
allowTransparency capture charset challenge cols contextMenu dateTime disabled form
formAction formEncType formMethod formTarget frameBorder inputMode is list manifest
maxLength media minLength role rows seamless size sizes srcSet width checked
controls loop multiple readOnly selected srcDoc value
```

Adding `aria-*` or `data-*` attributes requires passing an object to the attribute. For example,

```js
const aria = {hidden: false}
const data = {cool: `dude`, veryRad: `gal`}

<div aria={aria} data={data} />
```

will render,

```html
<div aria-hidden="false" data-cool="dude" data-very-rad="gal"></div>
```

## Setup

To install Yolk, simply include it in your `package.json`,

```
npm install yolk --save
```

Or instead with Bower,

```
bower install yolk --save
```
