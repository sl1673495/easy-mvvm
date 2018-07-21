export default class EventEmitter {
  constructor() {
    this._event = {}
  }

  on(name, callback) {
    (this._event[name] || (this._event[name] = [])).push(callback)
  }

  emit(name, payload) {
    const cbs = this._event[name] || []
    for (let i = 0, len = cbs.length; i < len; i++) {
      cbs[i](payload)
    }
  }
  clear() {
    this._event = {}
  }
}