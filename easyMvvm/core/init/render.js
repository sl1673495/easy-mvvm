import {parseDom, isTextNode, isEmptyNode} from "../../util/util";
import {eventBus} from "../event/instance";

export default (vm) => {
    const render = () => complier(vm)
    //将render方法注册到事件总线
    eventBus.on('render', render)
    render()
}


/**
 * 根据template编译模板 添加绑定事件等
 * @param vm
 */
function complier(vm) {
    const {_options: {template, el}} = vm
    const complierChild = (childNodes) => {
        for (let i = 0, len = childNodes.length; i < len; i++) {
            const node = childNodes[i]
            if (node.childNodes && node.childNodes.length) {
                // 递归调用
                complierChild(node.childNodes)
            }
            if (isTextNode(node)) {
                if (!isEmptyNode(node)) {
                    const {keys: watchKeys, renderMethods} = complierTextNode(node, vm)
                    if (watchKeys && watchKeys.length) {
                        // 在setter里emit这个事件 实现驱动视图变化
                        let j = 0, klen = watchKeys.length
                        for (; j < klen; j++) {
                            eventBus.on(`${watchKeys[j]}-render`, renderMethods)
                        }
                    }
                }
            } else {
                complierNormalNode(node, vm)
            }
        }
    }
    const dom = parseDom(template)
    document.querySelector(el).appendChild(dom)
    complierChild(dom.childNodes, vm)
    return dom
}

/**
 * 编译文字节点 解析模板语法
 * @param node
 * @param vm
 */
function complierTextNode(node, vm) {
    const {_options: {data}} = vm
    // 根据{{}}去匹配命中的nodeValue
    const regExp = /{{[^\{]*}}/g
    const textTemplate = node.nodeValue
    const matches = node.nodeValue.match(regExp)
    const ret = {
        shouldCollect: false,
        key: null,
    }
    if (matches && matches.length) {
        // 把通过匹配模板如{{msg}}和data渲染dom的方法返回出去 保存在事件监听里
        const calcMatches = (textTemp) => {
            let result, l = 0, retMatchedKeys = [], len = matches.length, dataKeys = Object.keys(data)
            // 循环这个文字节点中{{}}包裹的文字
            for (; l < len; l++) {
                // 替换{{}}得到表达式 currentMatchedKeys记录这单个模板中有几个key匹配到了
                let currentMatchedKeys = []
                let expression = matches[l].slice(2, matches[l].length - 2).trim()
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
                expression = `return ${expression}`
                expression = new Function('vm', `
                    with(vm) {
                        ${expression}
                    }
                `)(vm)
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
        ret.renderMethods = calcMatches.bind(null, textTemplate)
        calcMatches(textTemplate)
    }
    return ret
}

/**
 * 编译普通节点 解析事件绑定
 * @param node
 * @param vm
 */
function complierNormalNode(node, vm) {
    const {_options: {methods}} = vm
    const attrs = node.attributes
    let i, len
    for (i = 0, len = attrs.length; i < len; i++) {
        const name = attrs[i].nodeName
        const value = attrs[i].nodeValue
        if (name[0] === '@') {
            const eventName = name.slice(1)
            node.addEventListener(eventName, methods[value].bind(vm))
        }
    }
}

