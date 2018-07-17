import initState from './core/init/state'
import initRender from './core/init/render'

const ProxyMvvm = function (options) {
  this._options = options
  initState(this)
  initRender(this)
}

export default ProxyMvvm