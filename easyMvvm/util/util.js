import { LOOP_ATTR } from './constant'

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

export const replaceSpace = str => str.replace(/\s/g, '')