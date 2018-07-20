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
    const cbs = this._event[name] || [];
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
// CONCATENATED MODULE: ./easyMvvm/util/constant.js
const LOOP_ATTR = 'e-for';

const EVENT_ATTR = '@';
// CONCATENATED MODULE: ./easyMvvm/util/util.js


const parseDom = domText => {
  const ele = document.createElement('div');
  ele.innerHTML = domText;
  return ele.children[0];
};

const isTextNode = node => node.nodeName === '#text';

const isEmptyNode = node => node.nodeValue && node.nodeValue.trim() === '';

const evalWithScope = (data, expression) => new Function('data', `with(data) {${expression}}`)(data);

const insertAfter = (newElement, targetElement) => {
  const parent = targetElement.parentNode;
  if (parent.lastChild === targetElement) {
    // 如果最后的节点是目标元素，则直接添加。因为默认是最后
    parent.appendChild(newElement);
  } else {
    parent.insertBefore(newElement, targetElement.nextSibling);
    //如果不是，则插入在目标元素的下一个兄弟节点 的前面。也就是目标元素的后面
  }
};

const isLoopNode = node => {
  const attrs = node.attributes;
  if (!attrs) {
    return false;
  }
  for (let attr of attrs) {
    if (attr.nodeName === LOOP_ATTR) {
      return true;
    }
  }
  return false;
};

// 替换花括号
const replaceCurly = str => str.slice(2, str.length - 2).trim();

const replaceSpace = str => str.replace(/\s/g, '');
// CONCATENATED MODULE: ./easyMvvm/core/init/render.js




const templateRegExp = /{{[^\{]*}}/g;

/* harmony default export */ var render = (vm => complier(vm));

/**
 * 根据template编译模板 添加绑定事件等
 * @param vm
 */
function complier(vm) {
    const { _options: { template, el } } = vm;
    const dom = parseDom(template);
    document.querySelector(el).appendChild(dom);
    complierNodes(dom.childNodes, vm);
    return dom;
}

/**
 * 递归解析一个dom数组
 * @param {*} nodes 
 * @param {*} vm 
 */
function complierNodes(nodes, vm, forbidEvent) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!isTextNode(node)) {
            complierNormalNode(node, vm);
        } else {
            if (!isEmptyNode(node)) {
                const { keys: watchKeys, renderMethods } = complierTextNode(node, vm);
                if (watchKeys && watchKeys.length && !forbidEvent) {
                    // 在setter里emit这个事件 实现驱动视图变化
                    let j = 0,
                        klen = watchKeys.length;
                    for (; j < klen; j++) {
                        eventBus.on(`${watchKeys[j]}-render`, renderMethods);
                    }
                }
            }
        }
        if (node.childNodes && node.childNodes.length && !isLoopNode(node)) {
            // 递归调用
            complierNodes(node.childNodes, vm, forbidEvent);
        }
    }
    return nodes;
}

/**
 * 编译文字节点 解析模板语法
 * @param node
 * @param vm
 */
function complierTextNode(node, vm) {
    const { _options: { data } } = vm;
    // 根据{{}}去匹配命中的nodeValue
    const textTemplate = node.nodeValue;
    const matches = node.nodeValue.match(templateRegExp);
    const ret = {
        shouldCollect: false,
        key: null
    };
    if (matches && matches.length) {
        // 把通过匹配模板如{{msg}}和data渲染dom的方法返回出去 保存在事件监听里
        const calaMatches = textTemp => {
            let result,
                l = 0,
                retMatchedKeys = [],
                len = matches.length,
                dataKeys = Object.keys(data);
            // 循环这个文字节点中的{{}}模版， 一个文字节点中可能会有多个{{}}
            for (; l < len; l++) {
                // 替换{{}}得到表达式 currentMatchedKeys记录这单个模板中有几个key匹配到了
                let currentMatchedKeys = [];
                let expression = replaceCurly(matches[l]);
                // 如果{{}}中的字符串完全是data中的key 就直接赋值
                // 否则用正则解析内容中是否有匹配data里的key的值
                if (expression in data) {
                    currentMatchedKeys.push(expression);
                } else {
                    // 否则循环data中的所有key去模板中找匹配项
                    let j = 0,
                        klen = dataKeys.length;
                    for (; j < klen; j++) {
                        const dataKey = dataKeys[j];
                        if (expression.includes(dataKey)) {
                            currentMatchedKeys.push(dataKey);
                        }
                    }
                }
                expression = `return ${expression}`;
                // 利用eval实现解析模板内表达式
                expression = evalWithScope(vm, expression);
                // 根据data中key对应的值替换nodeValue
                // 在循环替换的过程中第一次使用textTemp 每次循环后把result变更成替换后的值
                // 这样可以解决一个文本节点有多次使用{{}}的情况
                l === 0 ? result = textTemp.replace(matches[l], expression) : result = result.replace(matches[l], expression);
                retMatchedKeys.push(...currentMatchedKeys);
            }
            if (retMatchedKeys.length) {
                ret.keys = retMatchedKeys;
            }
            node.nodeValue = result;
        };
        ret.renderMethods = calaMatches.bind(null, textTemplate);
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
    const attrs = node.attributes;
    let i, len;
    for (i = 0, len = attrs.length; i < len; i++) {
        const name = attrs[i].nodeName;
        const value = attrs[i].nodeValue;
        if (name[0] === EVENT_ATTR) {
            parseEvents(node, name, value, vm);
        }
        if (name === LOOP_ATTR) {
            const parseLoop = parseLoopCreator(node, value, vm);
            parseLoop();
        }
    }
}

/**
 * 解析事件
 * @param {*} node 
 * @param {*} name 
 * @param {*} value 
 * @param {*} vm 
 */
function parseEvents(node, name, value, vm) {
    const eventName = name.slice(1);
    node.addEventListener(eventName, vm[value].bind(vm));
}

/**
 * 解析循环标签
 * 原理：通过recursiveReplace
 * 将for标签下面的节点里的文本节点中的{{}}
 * 里的变量替换成vm作用域下可以读到的变量
 * 再交给complieredNodes处理完后
 * 通过一定的规则添加到真实dom节点中去
 * @param {*} node 
 * @param {*} value 
 * @param {*} vm 
 */
function parseLoopCreator(node, value, vm) {
    // 闭包记录上一次循环标签的数组
    let lastLoopNodes = null;
    // 记录循环节点的模板 第一次被替换掉了就拿不到了
    let templateNode = null;
    value = replaceSpace(value);
    // left对应用户自己命名的单个变量
    // right对应vm data中的数组
    // 如 item in items
    const [left, right] = value.split('in');
    // 拿到vm中的对应数组
    const parseLoop = () => {
        const loopResource = vm[right];
        if (!loopResource) {
            return;
        }
        // 记录需要往后insert元素与克隆的参考节点
        let targetNode;
        if (!lastLoopNodes) {
            // 在第一次调用的时候 往传入的node后面insert
            // 并且记录下最开始的模板 
            targetNode = node;
            templateNode = node;
        } else {
            // 在之后通过事件触发调用的时候 往lastLoopNodes的第一项后面insert
            targetNode = lastLoopNodes[0];
        }

        const loopNodes = [];
        // 把模板节点clone出来 交给recursiveReplace批量替换
        // 将类似{{item}}的字符串替换成{{items[0]}}
        loopResource.forEach((value, index) => {
            const cnode = templateNode.cloneNode(true);
            cnode.removeAttribute(LOOP_ATTR);
            recursiveReplace(cnode, left, right, index);
            loopNodes.push(cnode);
        });
        // 这样再交给complierNodes 就可以直接解析出来了
        const complieredNodes = complierNodes(loopNodes, vm, true /* forbidEvent,循环的触发事件在下面注册 */);
        // 将解析完的dom数组循环插入到参考节点后面
        // 每次都将参考节点标记为插入的上一个节点 保证插入顺序
        for (let complieredNode of complieredNodes) {
            insertAfter(complieredNode, targetNode);
            targetNode = complieredNode;
        }

        // 在插入完成后的处理
        // 第一次在dom中移除for标签的node
        // 之后每次调用 移除lastLoopNodes中的每一项
        if (!lastLoopNodes) {
            node.parentNode.removeChild(node);
        } else {
            for (let nodeForRemove of lastLoopNodes) {
                nodeForRemove.parentNode.removeChild(nodeForRemove);
            }
        }
        lastLoopNodes = loopNodes;
    };
    // 注册事件触发
    eventBus.on(`${right}-render`, parseLoop);
    return parseLoop;
}

/**
 * 下面注释以e-for="item in items"为例
 * 递归替换一个循环节点下面的{{}}模板 
 * 我是{{item}} --> 我是{{items[0]}}
 * 这样complierNodes才能直接解析出来
 * @param {*} node 
 * @param {*} replaceTarget 要替换成的数组key 要动态的在后面拼接上[index]
 * @param {*} resource 替换的源数组 如items
 * @param {*} replaceIndex 替换的下标 如item 替换成items[0]
 */
function recursiveReplace(node, replaceTarget, resource, replaceIndex) {
    if (isTextNode(node)) {
        node.nodeValue = node.nodeValue.replace(new RegExp(replaceTarget, 'g'), `${resource}[${replaceIndex}]`);
    } else if (node.childNodes && node.childNodes.length) {
        for (let childNode of node.childNodes) {
            recursiveReplace(childNode, replaceTarget, resource, replaceIndex);
        }
    }
    return node;
}
// CONCATENATED MODULE: ./easyMvvm/core/lifecycle/lifecycle.js
function callHook(hook, vm) {
  const hookFn = vm._options[hook];
  hookFn && hookFn.call(vm);
}
// CONCATENATED MODULE: ./easyMvvm/index.js




const ProxyMvvm = function (options) {
  this._options = options;
  state(this);
  callHook('created', this);
  render(this);
  callHook('mounted', this);
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
                    <h1 e-for="item in items">this is {{item}} {{++item}}</h1>
                    <p>{{msg}}</p>
                    <p>{{msg1}}</p>
                    <button @click=change>change</button>
                    <input @input=input />
                  </div>
                `,
    created() {
        this.msg1 = '我在created时被改变了';
    },
    mounted() {
        setTimeout(() => {
            this.msg1 = '我在mounted时被改变了';
        }, 1000);
    },
    data: {
        msg: 'easy-mvvm',
        msg1: 'easy-local',
        msg2: 'hello world',
        items: [1, 2, 3],
        flag: true
    },
    methods: {
        change() {
            this.items = [main_i++, main_i++, main_i++];
        },
        input(e) {
            this.msg1 = e.target.value;
        }
    }
});

/***/ }),
/* 1 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
],[0]);