webpackJsonp([0],[
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// CONCATENATED MODULE: ./easyMvvm/core/event/event.js
class EventEmitter {
  constructor() {
    this._event = {};
  }

  on(name, callback) {
    (this._event[name] || (this._event[name] = [])).push(callback);
  }

  emit(name, payload) {
    const cbs = this._event[name];
    for (let i = 0, len = cbs.length; i < len; i++) {
      cbs[i](payload);
    }
  }
}
// CONCATENATED MODULE: ./easyMvvm/core/event/instance.js


const eventBus = new EventEmitter();
// CONCATENATED MODULE: ./easyMvvm/core/reactive/define.js


function defineReactive(data) {
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    let val = data[key];
    Object.defineProperty(data, keys[i], {
      get: function reactiveGetter() {
        return val;
      },
      set: function reactiveSetter(newVal) {
        if (val === newVal) return val;
        val = newVal;
        eventBus.emit(`${key}-render`);
        return newVal;
      }
    });
  }
}
// CONCATENATED MODULE: ./easyMvvm/core/init/state.js


/* harmony default export */ var state = (function (vm) {
  const { data = {}, methods = {} } = vm._options;
  initData(vm, data);
  initMethods(vm, methods);
  defineReactive(data);
});

function initData(vm, data) {
  const keys = Object.keys(data);
  for (const key of keys) {
    if (!(key in vm)) {
      proxy(vm, key, data);
    }
  }
}

function initMethods(vm, methods) {
  const keys = Object.keys(methods);
  for (const key of keys) {
    if (!(key in vm)) {
      proxy(vm, key, methods);
    }
  }
}

function proxy(obj, key, source) {
  Object.defineProperty(obj, key, {
    get() {
      return source[key];
    },
    set(val) {
      source[key] = val;
    }
  });
}
// CONCATENATED MODULE: ./easyMvvm/util/util.js
const parseDom = domText => {
  const ele = document.createElement('div');
  ele.innerHTML = domText;
  return ele.children[0];
};

const isTextNode = node => node.nodeName === '#text';

const isEmptyNode = node => node.nodeValue && node.nodeValue.trim() === '';
// CONCATENATED MODULE: ./easyMvvm/core/init/render.js



/* harmony default export */ var init_render = (vm => {
    const render = () => complier(vm);
    //将render方法注册到事件总线
    eventBus.on('render', render);
    render();
});

/**
 * 根据template编译模板 添加绑定事件等
 * @param vm
 */
function complier(vm) {
    const { _options: { methods, template, el } } = vm;
    const complierChild = childNodes => {
        for (let i = 0, len = childNodes.length; i < len; i++) {
            const node = childNodes[i];
            if (node.childNodes && node.childNodes.length) {
                // 递归调用
                complierChild(node.childNodes);
            }
            if (isTextNode(node)) {
                if (!isEmptyNode(node)) {
                    const { shouldCollect, key: watchKey, renderMethods } = complierTextNode(node, vm);
                    if (shouldCollect) {
                        // 在setter里emit这个事件 实现驱动视图变化
                        eventBus.on(`${watchKey}-render`, renderMethods);
                    }
                }
            } else {
                complierNormalNode(node, vm);
            }
        }
    };
    const dom = parseDom(template);
    document.querySelector(el).appendChild(dom);
    complierChild(dom.childNodes, vm);
    vm._hasRender = true;
    return dom;
}

/**
 * 编译文字节点 解析模板语法
 * @param node
 * @param vm
 */
function complierTextNode(node, vm) {
    const { _options: { data } } = vm;
    // 根据{{}}去匹配命中的nodeValue
    const regExp = /{{[^\{]*}}/g;
    const textTemplate = node.nodeValue;
    const matches = node.nodeValue.match(regExp);
    const ret = {
        shouldCollect: false,
        key: null
    };
    if (matches && matches.length) {
        // 把通过匹配模板如{{msg}}和data渲染dom的方法返回出去 保存在事件监听里
        const calaMatches = textTemp => {
            let l = 0,
                len = matches.length,
                dataKeys = Object.keys(data);
            for (; l < len; l++) {
                // 替换{{}}得到表达式
                let key;
                let expression = matches[l].slice(2, matches[l].length - 2).trim();
                // 如果{{}}中的字符串完全是data中的key 就直接赋值
                // 否则用正则解析内容中是否有匹配data里的key的值
                if (expression in data) {
                    key = expression;
                } else {
                    let j = 0,
                        klen = dataKeys.length;
                    const keyRe = new RegExp(`^${dataKeys[j]}\\s|\\s${dataKeys[j]}\\s`);
                    for (; j < klen; j++) {
                        const keyMatches = expression.match(keyRe);
                        if (keyMatches) {
                            key = keyMatches[0].trim();
                        }
                    }
                }
                if (!key) {
                    console.warn(`
                        key is not found in data
                        but use in template
                        check the fragment:
                        ${expression}
                     `);
                    return;
                }
                expression = expression.replace(key, data[key]);
                // 根据data中key对应的值替换nodeValue
                node.nodeValue = textTemp.replace(matches[l], expression);
                ret.shouldCollect = true;
                ret.key = key;
                ret.renderMethods = calaMatches.bind(null, textTemplate);
            }
        };
        calaMatches(textTemplate);
    }
    return ret;
}

/**
 * 编译普通节点 解析事件绑定
 * @param node
 * @param vm
 */
function complierNormalNode(node, vm) {
    const { _options: { methods } } = vm;
    const attrs = node.attributes;
    let i, len;
    for (i = 0, len = attrs.length; i < len; i++) {
        const name = attrs[i].nodeName;
        const value = attrs[i].nodeValue;
        if (name[0] === '@') {
            const eventName = name.slice(1);
            node.addEventListener(eventName, methods[value].bind(vm));
        }
    }
}
// CONCATENATED MODULE: ./easyMvvm/index.js



const ProxyMvvm = function (options) {
  this._options = options;
  state(this);
  init_render(this);
};

/* harmony default export */ var easyMvvm = (ProxyMvvm);
// EXTERNAL MODULE: ./app/index.css
var app = __webpack_require__(1);
var app_default = /*#__PURE__*/__webpack_require__.n(app);

// CONCATENATED MODULE: ./app/main.js



let main_i = 0;

new easyMvvm({
    el: '#app',
    template: `
                  <div>
                    <h1>this is {{msg}}</h1>
                    <p>{{  msg2  }}</p>
                    <button @click=change>change</button>
                    <input @input=input />
                  </div>
                `,
    methods: {
        change() {
            this.msg = 'hello';
            this.msg2 = 'data is changed!!' + ++main_i;
        },
        input(e) {
            this.msg = e.target.value;
        }
    },
    data: {
        msg: 'easy-mvvm',
        msg2: 'hello world'
    }
});

/***/ }),
/* 1 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
],[0]);