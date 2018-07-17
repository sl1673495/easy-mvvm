import {parseDom, isTextNode, isEmptyNode} from "../../util/util";
import {rootEm} from "../event/instance";


export default (vm) => {
    const {el} = vm._options
    const render = () => {
        document.body.replaceChild(
            complier(vm),
            document.querySelector(el)
        )
    }
    //将render方法注册到事件总线
    rootEm.on('render', render)
    render()
}


/**
 * 根据template编译模板 添加绑定事件等
 * @param vm
 */
function complier(vm) {
    const {_options: {data, methods, template, el}} = vm
    const complierChild = (childNodes) => {
        for (let i = 0, len = childNodes.length; i < len; i++) {
            const node = childNodes[i]
            if (node.childNodes && node.childNodes.length) {
                // 递归调用
                complierChild(node.childNodes)
            }
            if (isTextNode(node)) {
                if (!isEmptyNode(node)) {
                    complierTextNode(node, data)
                }
            } else {
                complierNormalNode(node, methods)
            }
        }
    }
    const dom = parseDom(template)
    complierChild(dom.childNodes, vm)
    dom.setAttribute('id', el.slice(1))
    return dom
}

/**
 * // 编译文字节点
 * @param node
 * @param data
 */
function complierTextNode(node, data) {
    // 根据{{}}去匹配命中的nodeValue
    const regExp = /{{\w*}}/g
    const matches = node.nodeValue.match(regExp)
    if (matches && matches.length) {
        let l = 0, len = matches.length
        for (l; l < len; l++) {
            // 替换{{}}得到key
            const key = matches[l].slice(2, matches[l].length - 2)
            if (key in data) {
                // 根据data中key对应的值替换nodeValue
                node.nodeValue = node.nodeValue.replace(matches[l], data[key])
            }
        }
    }
}

/**
 * 编译普通节点
 * @param node
 * @param data
 * @param methods
 */
function complierNormalNode(node, methods) {
    const attrs = node.attributes
    let i, len
    for (i = 0, len = attrs.length; i < len; i++) {
        const name = attrs[i].nodeName
        const value = attrs[i].nodeValue
        if (name[0] === '@') {
            const eventName = name.slice(1)
            node.addEventListener(eventName, methods[value])
        }
    }
}

