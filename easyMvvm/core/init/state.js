import { defineReactive } from "../reactive/define";

export default function (vm) {
  const { data = {} } = vm._options
  defineReactive(data)
}
