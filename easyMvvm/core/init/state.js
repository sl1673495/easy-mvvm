import { defineReactive } from "../reactive/define";

export default function (vm) {
  const { data = {}, methods = {} } = vm._options
  initData(vm, data)
  initMethods(vm, methods)
  defineReactive(data)
}

function initData(vm, data) {
  const keys = Object.keys(data)
  for (const key of keys) {
    if (!(key in vm)) {
      proxy(vm, key, data)
    }
  }
}

function initMethods(vm, methods) {
  const keys = Object.keys(methods)
  for (const key of keys) {
    if (!(key in vm)) {
      proxy(vm, key, methods)
    }
  }
}

function proxy(obj, key, source) {
  Object.defineProperty(obj, key, {
    get() {
      return source[key]
    },
    set(val) {
      source[key] = val
    }
  })
}
