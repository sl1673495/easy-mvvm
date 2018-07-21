import {defineReactive} from "../reactive/define";
import {eventBus} from "../event/instance";
import EventEmitter from "../event/event";

const shareProperty = {
    enumerable: true,
    configurable: true,
}

export default function (vm) {
    const {data = {}} = vm._options
    initData(vm)
    initMethods(vm)
    initComputed(vm)
    defineReactive(data)
}

function initData(vm) {
    const {data = {}} = vm._options
    proxyToVm(vm, data)
}

function initMethods(vm) {
    const { methods = {}} = vm._options
    proxyToVm(vm, methods)
}

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
    // 创建一个事件中心用来收集computed方法在data里的依赖
    const collectComputedEm = new EventEmitter()
    const {data = {}, computed = {}} = vm._options
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

function proxyToVm(vm, source) {
    const keys = Object.keys(source)
    for (const key of keys) {
        if (!(key in vm)) {
            proxy(vm, key, source)
        }
    }
}

function proxy(obj, key, source) {
    shareProperty.get = function() {
        return source[key]
    }

    shareProperty.set = function (val) {
        source[key] = val
    }
    Object.defineProperty(obj, key, shareProperty)
}
