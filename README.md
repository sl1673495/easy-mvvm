# easy-mvvm
简易mvvm框架
核心代码在easyMvvm里
#### 
预览地址 
https://sl1673495.github.io/easy-mvvm/
#### 使用方法
```
new EasyMvvm({
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
            this.msg = 'hello'
            this.msg2 = 'data is changed!!'
        },
        input(e) {
            this.msg = e.target.value
        }
    },
    data: {
        msg: 'easy-mvvm',
        msg2: 'hello world'
    }
})
```
#### 与vue实现的一些不同
在vue中，实现数据变更视图更新的核心逻辑在于劫持data的getter，通过 dep.depend收集依赖，
在setter中通过dep.notify通知watcher进行视图更新
easy-mvvm简化了这部分的实现
```
const calaMatches = (textTemp) => {
            let l = 0, len = matches.length, dataKeys = Object.keys(data)
            for (; l < len; l++) {
                // 替换{{}}得到表达式
                let key
                let expression = matches[l].slice(2, matches[l].length - 2).trim()
                // 如果{{}}中的字符串完全是data中的key 就直接赋值
                // 否则用正则解析内容中是否有匹配data里的key的值
                if (expression in data) {
                    key = expression
                } else {
                    let j = 0, klen = dataKeys.length
                    const keyRe = new RegExp(`^${dataKeys[j]}\\s|\\s${dataKeys[j]}\\s`)
                    for (; j < klen; j++) {
                        const keyMatches = expression.match(keyRe)
                        if (keyMatches) {
                            key = keyMatches[0].trim()
                        }
                    }
                }
                if (!key) {
                    console.warn(
                        `
                        key is not found in data
                        but use in template
                        check the fragment:
                        ${expression}
                     `
                    )
                    return
                }
                expression = expression.replace(key, data[key])
                // 根据data中key对应的值替换nodeValue
                node.nodeValue = textTemp.replace(matches[l], expression)
                ret.shouldCollect = true
                ret.key = key
                ret.renderMethods = calaMatches.bind(null, textTemplate)
            }
        }
```
这部分是文字节点render的核心方法， 注意
```
ret.shouldCollect = true
ret.key = key
ret.renderMethods = calaMatches.bind(null, textTemplate)
```
最后这个ret中把这个方法当做一个属性返回出去
```
const { shouldCollect, key: watchKey, renderMethods } = complierTextNode(node, vm)
if (shouldCollect) {
  // 在setter里emit这个事件 实现驱动视图变化
   eventBus.on(`${watchKey}-render`, renderMethods)
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

