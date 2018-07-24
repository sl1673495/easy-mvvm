# easy-mvvm
简易mvvm框架
核心代码在easyMvvm里
## 预览地址 
https://sl1673495.github.io/easy-mvvm/
## 使用方法
```

let i = 0

new EasyMvvm({
    el: '#app',
    template: `
                  <div>
                    <h2>e-for="item in items"</h2>
                    <p e-for="item in items">this is {{item}}</p>
                     <button @click=change>items数组中数字改变</button>
                    <h2>msg</h2>
                    <p>{{msg}}</p>
                    <h2>msg1</h2>
                    <p>{{msg1}}</p>
                    <h2>computed(msg + msg1)</h2>
                    <p>{{sum}}</p>
                    <input @input=input placeholder="改变msg1的内容" />
                  </div>
                `,
    created() {
        this.msg1 = '我在created时被改变了'
    },
    computed: {
        sum() {
            return this.msg + this.msg1
        }
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
            this.msg2 = 'data is changed!!' + (++i)
            setTimeout(() => {
                this.msg2 = 'change async'
            }, 1000)
            this.items = [i++, i++, i++]
        },
        input(e) {
            this.msg1 = e.target.value
        }
    },
})

```
## 整体思路
```
    将配置对象传入new EasyMvvm构造器
    core/init/state
        初始化data, methods, computed等
        将data, methods, computed里的值都代理到this示例下,
        并且劫持data的每个key的set方法， 触发事件`${key}-render`
        computed的实现在下面通过代码讲解
    core/init/render:
        compile方法拿到template解析出真实dom
        compileNodes去解析这些真实dom
        下面分两种情况

        文本节点：
            通过compileTextNode处理， 用正则去解析出{{}}里的内容
            先收集{{}}里面依赖了我们vm实例下的哪些内容,用数组retMatchedKeys存起来
            里面的内容可以是个js表达式比如msg + msg2 或者三元表达式，
            所以用new Function(vm) 把实例传入，并且在内部通过with(vm)
            将作用域改变成我们的vm实例， 这样只要是合法的js表达式都可以解析出来
            解析出内容以后把{{}}整个替换成解析完成的内容
            并且将这个解析的方法保存起来, 遍历retMatchedKeys的内容
            给我们的事件中心eventBus注册事件(`${key}-render`)，触发的方法就是文本节点编译的方法
            这样在this下的数据改变的时候，就会自动触发我们的文本节点更新
        普通节点：
            通过compileNormalNode处理， 解析出节点上的循环标志(e-for)和事件监听(e-bind)标志
            在e-for节点的编译中，如果节点中有e-bind标志 我们是不去处理的
            为什么呢，接下来先看e-for的编译过程：
            循环节点通过parseLoopCreator生成一个parseLoop方法，
            这里用函数柯里化的原因是我们想要通过闭包保存e-for节点重新渲染的时候更新的dom节点数组，
            parseLoop方法的核心逻辑就是通过cloneElement对参照节点进行数组长度次数的clone,
            在循环中我们要调用recursiveReplace这个递归解析的方法，
            因为比如我们写e-for="item in items" 在子节点中我们一定会出现{{item}} 或者e-bind-click="get(item)"
            之类的方法， 但这个东西直接交给我们的compileNodes去解析的话是会报错的，因为我们的vm作用域下并没有这个item
            所以我们的目标就是通过recursiveReplace把类似于
            <h1 e-for="item in items">{{item}}</h1>
            循环生成的
            <h1>{{item}}</h1>
            <h1>{{item}}</h1>
            替换成
            <h1>{{items[0]}}</h1>
            <h1>{{items[1]}}</h1>
            这样再丢给compileNodes处理后返回的节点就是文本编译过后的节点了，
            这个时候我们的render事件不交给compileNodes去注册
            而是我们在parseLoopCreator的最后自己注册(items-render, parseLoop)
            由于parseLoopCreator是个柯里化的函数 所以只有在编译过程中遇到e-for会调用一次
            之后的items更新触发的渲染只会调用parseLoop方法了。

            到这里我们还没说e-bind节点的事件绑定，事件绑定的处理有两种方法，
            比如在vue里我们可以@click=change 也可以@click=change(1)
            但这个其实在编译的时候要分两种情况走，我们解析e-bind后面的value值的括号，
            如果有括号 那么要通过new Function把括号里的内容传进去 在vm的作用域下解析并返回
            然后给dom节点注册相应的事件， 通过change.bind(...解析出来的参数) 来把这个事件的真实参数给它
            所以在e-for的recursiveReplace递归解析子节点的时候 也会把e-bind方法的括号中的值解析为vm作用域下能读到的值

    清楚了数据驱动视图render的逻辑以后就可以来看看computed是怎么实现了，
        computed的核心思想:
        以下以这个computed为例：{
             sum() {return this.data1 + this.data2}
        }
        clone一个vm的data，给这个data的每一项key定义get事件，
        get的时候让一个新的事件中心触发一个trigger事件，payload就是这个触发get的key
        定义computedOptions对象，用来记录每个computedKey所依赖的data里的key
        然后遍历computed对象，获取computed方法
        将上下文设立成clone的data，那么在执行求值的时候就会触发我们的trigger事件
        就可以往相应的computedOptions[computedKey].deps里push触发事件的data的key
        就收集到{ sum: { deps: [data1, data2]}} 这样的依赖集合。
        最后我们给vm的实例上define我们的computedKey 并且get就返回computedFn在上下文为vm时的执行结果,
        因为在render的时候读到sum这个属性 会给eventBus中注册sum-render时更新视图的方法
        所以我们要定义在触发data1-render或data2-render的时候也要触发sum-render去更新视图

```
## 部分代码
#### 文本节点渲染、更新方法
```
 const calcMatches = (textTemp) => {
            let result = textTemp,
                l = 0,
                retMatchedKeys = [],
                len = matches.length,
                vmKeys = Object.keys(vm)

            // 循环这个文字节点中的{{}}模版， 一个文字节点中可能会有多个{{}}
            for (; l < len; l++) {
                // 缓存最开始的模板
                let expressionCache = matches[l]

                // 替换{{}}得到表达式 currentMatchedKeys记录这单个模板中有几个key匹配到了
                let currentMatchedKeys = []
                let expression = replaceCurly(matches[l])

                // 收集这个模板中所依赖的key
                // 如果{{}}中的字符串完全是data中的key 就直接收集
                // 否则用正则解析内容中是否有匹配data里的key的值
                if (expression in data) {
                    currentMatchedKeys.push(expression)
                } else {
                    // 否则循环data中的所有key去模板中找匹配项
                    let j = 0, klen = vmKeys.length
                    for (; j < klen; j++) {
                        const vmKey = vmKeys[j]
                        if (expression.includes(vmKey)) {
                            currentMatchedKeys.push(vmKey)
                        }
                    }
                }

                try {
                    expression = `return ${expression}`
                    // 利用eval实现解析模板内表达式
                    expression = evalWithScope(vm, expression)
                    // 解析未出错 则在数据变化触发渲染
                    retMatchedKeys.push(...currentMatchedKeys)
                }catch (e) {
                    // 解析出错 将模板恢复成原始状态
                    expression = expressionCache
                }finally {
                    // 根据data中key对应的值替换nodeValue
                    result = result.replace(matches[l], expression)
                }
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
        for (let {nodeName: name, nodeValue: value} of attrs) {
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

    const parseLoop = () => {
        // 拿到vm中的对应数组
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

        // 存放clone节点的数组
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

      return node
}

```
注释写的很清楚了 因为没有vue vnode和complier的实现
所以比较繁琐 需要手动操作dom来实现

#### computed的实现
computed的实现定义在core/init/state里

```
/**
 * computed的核心思想:
 * 以下以这个computed为例：{
 *      sum() {return this.data1 + this.data2}
 * }
 * clone一个vm的data，给这个data的每一项key定义get事件，
 * get的时候让事件中心触发一个trigger事件，payload就是这个触发get的key
 * 定义computedOptions对象，用来记录每个computedKey所依赖的data里的key
 * 然后遍历computed对象，获取computed方法
 * 将上下文设立成clone的data，那么在执行求值的时候就会触发我们的trigger事件
 * 就可以往相应的computedOptions[computedKey].deps里push触发事件的data的key
 * 就收集到{ sum: { deps: [data1, data2]}} 这样的依赖集合。
 * 最后我们给vm的实例上define我们的computedKey 并且get就返回computedFn在上下文为vm时的执行结果,
 * 因为在render的时候读到sum这个属性 会给eventBus中注册sum-render时更新视图的方法
 * 所以我们要定义在触发data1-render或data2-render的时候也要触发sum-render去更新视图
 * @param vm
 * @returns {*}
 */
function initComputed(vm) {
    const {data = {}, computed = {}} = vm._options

    // 创建一个事件中心用来收集computed方法在data里的依赖
    const collectComputedEm = new EventEmitter()

    // clone一个vm.data 防止污染源对象 只针对单层数据
    const cloneData = Object.assign({}, data)
    for (let key in cloneData) {
        // 在数据被get时触发trigger事件 带出相应的key
        Object.defineProperty(cloneData, key, {
            get() {
                collectComputedEm.emit('trigger', key)
            }
        })
    }

    const computedOptions = vm._computedOptions = {}

    // 循环去定义在trigger的时候将computedOptions中相应的key(computed的key)里的
    // deps依赖(data中对应的key)收集起来
    for (let computedKey in computed) {
        collectComputedEm.on('trigger',(key) => {
            const opt = (computedOptions[computedKey] || (computedOptions[computedKey] = {}))
            ;(opt.deps || (opt.deps = [])).push(key)
        })

        const computedFn = computed[computedKey]
        // 执行一次绑定上下文为cloneData的计算函数 收集到该计算属性依赖的所有key
        computedFn.call(cloneData)
        // 收集完毕以后将这次事件清空， 防止无意义的触发
        collectComputedEm.clear()

        // 将computedKey定义到vm上， 改写访问方法
        shareProperty.get = function () {
            return computedFn.call(vm)
        }
        Object.defineProperty(vm, computedKey, shareProperty)
    }

    // 依赖项更新视图的同时 也要更新computed对应的视图
    for (let computedOptionKey in computedOptions) {
        const deps = computedOptions[computedOptionKey].deps || []
        for (let dep of deps) {
            eventBus.on(`${dep}-render`, () => {
                eventBus.emit(`${computedOptionKey}-render`)
            })
        }
    }
}
```

