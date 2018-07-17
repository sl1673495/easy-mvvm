export const parseDom = (domText) => {
  const ele = document.createElement('div')
  ele.innerHTML = domText
  return ele.children[0]
}

export const isTextNode = node => node.nodeName === '#text'

export const isEmptyNode = node => node.nodeValue && node.nodeValue.trim() === ''