export default function callHook(hook, vm) {
  const hookFn = vm._options[hook]
  hookFn && hookFn.call(vm)
}