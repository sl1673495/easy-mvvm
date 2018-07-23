import { eventBus } from "../event/instance";

export function callHook(hook, vm) {
  const hookFn = vm._options[hook]
  hookFn && hookFn.call(vm)
}

export function registerUpdated(vm) {
  const updateFns = vm._options['updated']
  if (updateFns) {
    eventBus.listen(/.*-render/, updateFns.bind(vm))
  }
}