# easy-mvvm
简易mvvm框架
核心代码在easyMvvm里
## 预览地址 
https://sl1673495.github.io/easy-mvvm/
## 使用方法
```
new EasyMvvm({
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
        this.msg1 = '我在created时被改变了'
    },         
    mounted() {
       setTimeout(() => {
           this.msg1 = '我在mounted时被改变了(延迟是因为定时器演示效果)'
       }, 1000);
    },
    data: {
        msg: 'easy-mvvm',
        msg1: 'easy-local',
        msg2: 'hello world',
        items: [1,2,3], 
        flag: true
    },
    methods: {
        change() {
            this.items = [i++, i++, i++]
        },
        input(e) {
            this.msg1 = e.target.value
        }
    },
})
```
## 与vue实现的一些不同
#### 数据驱动视图的变化：
在vue中，实现数据变更视图更新的核心逻辑在于劫持data的getter，通过 dep.depend收集依赖，
在setter中通过dep.notify通知watcher进行视图更新
easy-mvvm简化了这部分的实现
```
const calcMatches = (textTemp) => {
            let result, l = 0, retMatchedKeys = [], len = matches.length, dataKeys = Object.keys(data)
            // 循环这个文字节点中的{{}}模版， 一个文字节点中可能会有多个{{}}
            for (; l < len; l++) {
                // 缓存最开始的模板
                let expressionCache = matches[l]
                // 替换{{}}得到表达式 currentMatchedKeys记录这单个模板中有几个key匹配到了
                let currentMatchedKeys = []
                let expression = replaceCurly(matches[l])
                // 如果{{}}中的字符串完全是data中的key 就直接赋值
                // 否则用正则解析内容中是否有匹配data里的key的值
                if (expression in data) {
                    currentMatchedKeys.push(expression)
                } else {
                    // 否则循环data中的所有key去模板中找匹配项
                    let j = 0, klen = dataKeys.length
                    for (; j < klen; j++) {
                        const dataKey = dataKeys[j]
                        if (expression.includes(dataKey)) {
                            currentMatchedKeys.push(dataKey)
                        }
                    }
                }

                try {
                    expression = `return ${expression}`
                    // 利用eval实现解析模板内表达式
                    expression = evalWithScope(vm, expression)
                }catch (e) {
                    // 解析出错 恢复原始字符串
                    expression = expressionCache
                }

                // 根据data中key对应的值替换nodeValue
                // 在循环替换的过程中第一次使用textTemp 每次循环后把result变更成替换后的值
                // 这样可以解决一个文本节点有多次使用{{}}的情况
                l === 0 ?
                    result = textTemp.replace(matches[l], expression) :
                    result = result.replace(matches[l], expression)
                retMatchedKeys.push(...currentMatchedKeys)
            }
            if (retMatchedKeys.length) {
                ret.keys = retMatchedKeys
            }
            node.nodeValue = result
        }
```
这部分是文字节点render的核心方法， 注意
```
ret.keys = retMatchedKeys
ret.renderMethods = calaMatches.bind(null, textTemplate)
```
最后这个ret中把这个方法当做一个属性返回出去
```
const { keys: watchKeys, renderMethods } = complierTextNode(node, vm)
                if (
                    watchKeys && 
                    watchKeys.length &&
                    !forbidEvent
                ) {
                    // 在setter里emit这个事件 实现驱动视图变化
                    let j = 0, klen = watchKeys.length
                    for (; j < klen; j++) {
                        eventBus.on(`${watchKeys[j]}-render`, renderMethods)
                    }
                }
```
这个watchKey就是观测的数据的key，我们将这个renderMethods注册到eventBus中
再来看数据劫持部分的逻辑
```
Object.defineProperty(data, keys[i], {
      get: function reactiveGetter() {
        return val
      },
      set: function reactiveSetter(newVal) {
        if (val === newVal) return val
        val = newVal
        eventBus.emit(`${key}-render`)
        return newVal
      },
    })
```
我们检测到set的数据和以前不同 就触发这个key对应的render方法
这样就简易的实现了数据更新驱动视图更新

#### for循环标签的实现：
```
/**
 * 编译普通节点 解析事件绑定
 * @param node
 * @param vm
 */
function complierNormalNode(node, vm) {
    const attrs = node.attributes
    let i, len
    for (i = 0, len = attrs.length; i < len; i++) {
        const name = attrs[i].nodeName
        const value = attrs[i].nodeValue
        if (name[0] === EVENT_ATTR) {
            parseEvents(node, name, value, vm)
        }
        if (name === LOOP_ATTR) {
            const parseLoop = parseLoopCreator(node, value, vm)
            parseLoop()
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
    const eventName = name.slice(1)
    node.addEventListener(eventName, vm[value].bind(vm))
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
    let lastLoopNodes = null
    // 记录循环节点的模板 第一次被替换掉了就拿不到了
    let templateNode = null
    value = replaceSpace(value)
    // left对应用户自己命名的单个变量
    // right对应vm data中的数组
    // 如 item in items
    const [left, right] = value.split('in')
    // 拿到vm中的对应数组
    const parseLoop = () => {
        const loopResource = vm[right]
        if (!loopResource) {
            return
        }
        // 记录需要往后insert元素与克隆的参考节点
        let targetNode
        if (!lastLoopNodes) {
            // 在第一次调用的时候 往传入的node后面insert
            // 并且记录下最开始的模板 
            targetNode = node
            templateNode = node
        } else {
            // 在之后通过事件触发调用的时候 往lastLoopNodes的第一项后面insert
            targetNode = lastLoopNodes[0]
        }

        const loopNodes = []
        // 把模板节点clone出来 交给recursiveReplace批量替换
        // 将类似{{item}}的字符串替换成{{items[0]}}
        loopResource.forEach((value, index) => {
            const cnode = templateNode.cloneNode(true)
            cnode.removeAttribute(LOOP_ATTR)
            recursiveReplace(cnode, left, right, index)
            loopNodes.push(cnode)
        })
        // 这样再交给complierNodes 就可以直接解析出来了
        const complieredNodes = complierNodes(loopNodes, vm, true /* forbidEvent,循环的触发事件在下面注册 */)
        // 将解析完的dom数组循环插入到参考节点后面
        // 每次都将参考节点标记为插入的上一个节点 保证插入顺序
        for (let complieredNode of complieredNodes) {
            insertAfter(complieredNode, targetNode)
            targetNode = complieredNode
        }

        // 在插入完成后的处理
        // 第一次在dom中移除for标签的node
        // 之后每次调用 移除lastLoopNodes中的每一项
        if (!lastLoopNodes) {
            node.parentNode.removeChild(node)
        } else {
            for (let nodeForRemove of lastLoopNodes) {
                nodeForRemove.parentNode.removeChild(nodeForRemove)
            }
        }
        lastLoopNodes = loopNodes
    }
    // 注册事件触发
    eventBus.on(`${right}-render`, parseLoop)
    return parseLoop
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
        node.nodeValue = node.nodeValue.replace(
            new RegExp(replaceTarget, 'g'),
            `${resource}[${replaceIndex}]`
        )
    } else if (node.childNodes && node.childNodes.length) {
        for (let childNode of node.childNodes) {
            recursiveReplace(childNode, replaceTarget, resource, replaceIndex)
        }
    }
    return node
}

```
注释写的很清楚了 因为没有vue vnode和complier的实现
所以比较繁琐 需要手动操作dom来实现

