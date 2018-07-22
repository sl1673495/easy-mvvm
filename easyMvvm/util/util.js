import { LOOP_ATTR, EVENT_ATTR } from './constant'

export const parseDom = (domText) => {
  const ele = document.createElement('div')
  ele.innerHTML = domText
  return ele.children[0]
}

export const isTextNode = node => node.nodeName === '#text'

export const isEmptyNode = node => node.nodeValue && node.nodeValue.trim() === ''

export const evalWithScope = (data, expression) => new Function('data', `with(data) {${expression}}`)(data)

export const insertAfter = (newElement, targetElement) => {
  const parent = targetElement.parentNode;
  if (parent.lastChild === targetElement) {
    // 如果最后的节点是目标元素，则直接添加。因为默认是最后
    parent.appendChild(newElement);
  } else {
    parent.insertBefore(newElement, targetElement.nextSibling);
    //如果不是，则插入在目标元素的下一个兄弟节点 的前面。也就是目标元素的后面
  }
}

export const isLoopNode = (node) => {
  const attrs = node.attributes
  if (!attrs) {
    return false
  }
  for (let attr of attrs) {
    if (attr.nodeName === LOOP_ATTR) {
      return true
    }
  }
  return false
}

// 替换花括号
export const replaceCurly = str => str.slice(2, str.length - 2).trim()

// 替换小括号
export const replaceBracket = str => str.slice(1, str.length - 1).trim()

export const replaceSpace = str => str.replace(/\s/g, '')

// 解析标签
export const resolveAttrs = (attrs) => {
    if (!attrs || !attrs.length) {
      return {}
    }

    let loopAttr,
        loopValue,
        eventAttr,
        eventValue

    for (let {nodeName: name, nodeValue: value} of attrs) {
        if (name === LOOP_ATTR) {
            loopAttr = name
            loopValue = value
        }
        if (name.includes(EVENT_ATTR)) {
            eventAttr = name
            eventValue = value
        }
    }

    return {
        loopAttr,
        loopValue,
        eventAttr,
        eventValue
    }
}

// 解析事件标签
export const resolveEvent = (eventValue) => {
  let args,
      eventMethod
  const argRegExp = /\(.*\)/
  const argMatches = eventValue.match(argRegExp)
  if (argMatches)  {
    const match = argMatches[0]
    args = replaceBracket(match).split(',')
    eventMethod = eventValue.replace(match, '')
  }else {
      eventMethod = eventValue
  }
  return {
      args,
      eventMethod
  }
}