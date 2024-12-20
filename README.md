# use-valtio-store

This React hook provides a way to manage state using Valtio, supporting persistent states with `localStorage` and `sessionStorage`.

## Installation

1. Install:

   ```zsh
   npm install valtio use-valtio-store
   ```

2. Usage

- Basic

```ts
import { createStore } from 'use-valtio-store'

const initialState = {
  count: 0,
}

const store = createStore(initialState, {
  key: 'my-app-state', // optional
  storage: "localStorage" // optional
  onInit(state) { // optional
    console.log({ state })
  }
})
```

- Class

```ts
import { createStore } from 'use-valtio-store'

class MyStore {
  count = 0

  get double() {
    return this.count * 2
  }

  inc() {
    this.count++
  }

  dec() {
    this.count--
  }
}

const store = createStore(new MyStore(), {
  key: 'my-app-state',
})
```
