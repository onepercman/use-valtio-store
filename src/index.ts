import { proxy, subscribe, useSnapshot } from 'valtio'

function _omit<T extends object>(obj: T, keys: Array<keyof T>): Omit<T, (typeof keys)[number]> {
  const result: Partial<T> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !keys.includes(key)) {
      result[key] = obj[key]
    }
  }
  return result as Omit<T, (typeof keys)[number]>
}

function _pick<T extends object>(obj: T, keys: Array<keyof T>): Pick<T, (typeof keys)[number]> {
  const result: Partial<T> = {}
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key]
    }
  }
  return result as Pick<T, (typeof keys)[number]>
}

type StorageType = 'localStorage' | 'sessionStorage'

interface WithInOrEx<T extends object> {
  include?: KeyList<T>
  exclude?: KeyList<T>
}

type KeyList<T extends object> = Array<keyof T>
interface ProxyWithPersistOptions<T extends object> extends WithInOrEx<T> {
  key: string
  storage?: StorageType
  onInit?(state: T): void
}

type UseStoreReturnType<T extends object> = Pick<
  T,
  { [K in keyof T]: T[K] extends (...args: any) => any ? never : K }[keyof T]
>

function _getStorage(type: StorageType): Storage | undefined {
  if (typeof window !== 'undefined') {
    return window[type]
  }
  return undefined
}

function _getPersistedData(key: string, storageType: StorageType) {
  try {
    const storage = _getStorage(storageType)
    if (!storage) return {}
    return JSON.parse(storage.getItem(key) || '')
  } catch (err) {
    return {}
  }
}

function _persist<T extends object>(
  key: string,
  state: T,
  storageType: StorageType,
  { exclude, include }: WithInOrEx<T>
) {
  const storage = _getStorage(storageType)
  if (!storage) throw new Error('Persist failed, Client not found')
  const data = include ? _pick(state, include) : exclude ? _omit(state, exclude) : state
  storage.setItem(key, JSON.stringify(data))
}

function _getMergedState<T extends object>(initialState: T, persistedState: T): T {
  const states = { ...initialState, ...persistedState }
  Object.setPrototypeOf(states, Object.getPrototypeOf(initialState))
  return states
}

function _createPersistStore<T extends object>(
  initialObject: T,
  persistOptions: ProxyWithPersistOptions<T>
): T {
  const { key, storage = 'localStorage', exclude, include, onInit } = persistOptions
  const mergedState = _getMergedState(initialObject, _getPersistedData(key, storage))
  _persist(key, mergedState, storage, { exclude, include })
  onInit && onInit(mergedState)

  const state = proxy(mergedState)

  const storageListener = (event: StorageEvent) => {
    if (event.key === key && event.storageArea === _getStorage(storage)) {
      const mergedState = _getMergedState(initialObject, _getPersistedData(key, storage))
      Object.assign(state, mergedState)
    }
  }

  window.addEventListener('storage', storageListener)

  subscribe(state, () => {
    _persist(key, state, storage, { exclude, include })
  })

  window.addEventListener('beforeunload', () => {
    window.removeEventListener('storage', storageListener)
  })

  return state
}

function createStore<T extends object>(
  initialObject: T,
  persistOptions?: ProxyWithPersistOptions<T>
): T {
  if (!persistOptions) return proxy(initialObject)
  return _createPersistStore(initialObject, persistOptions)
}

function useStore<T extends object>(
  store: T,
  options?: {
    sync?: boolean
  }
): UseStoreReturnType<T> {
  return useSnapshot(store, options) as UseStoreReturnType<T>
}

export { createStore, useStore }
