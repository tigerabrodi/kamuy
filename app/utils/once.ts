import type { ProperFunction } from '~/types'

const emptyObject = {}

export function once<Operation extends ProperFunction>(operation: Operation) {
  let memo: ReturnType<Operation>
  const out = function (...operationParameters: []): ReturnType<Operation> {
    if (!memo) {
      memo = operation(...operationParameters)
      // release reference to original function
      operation = emptyObject as Operation
    }
    return memo
  }
  return out as (...args: Parameters<Operation>) => ReturnType<Operation>
}
