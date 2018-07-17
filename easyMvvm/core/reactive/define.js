import { rootEm } from "../event/instance";

export function defineReactive(data) {
  const keys = Object.keys(data)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    let val = data[key]
    Object.defineProperty(data, keys[i], {
      get: function reactiveGetter() {
        return val
      },
      set: function reactiveSetter(newVal) {
        val = newVal
        rootEm.emit('render')
        return newVal
      },
    })
  }
}