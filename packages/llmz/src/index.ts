export { Tool } from './tool.js'
export { ObjectInstance } from './objects.js'

import { type ExecutionProps } from './llmz.js'
import { type ExecutionResult } from './types.js'

export const executeContext = async (props: ExecutionProps) => {
  // Code splitting to improve import performance
  const { executeContext } = (await import('./llmz.js')).llmz
  return executeContext(props) as Promise<ExecutionResult>
}

/**
 * Loads the necessary dependencies for the library to work
 * Calling this function is optional, but it will improve the performance of the first call to `executeContext`
 * It's recommended to call this function at the beginning of your application without awaiting it (void init())
 */
export const init = async () => {
  await import('./llmz.js')
  await import('./tool.js')
  await import('./jsx.js')
  await import('./vm.js')
  await import('./utils.js')
  await import('./truncator.js')
  await import('./typings.js')
  await import('./prompts/oct-2024.js')
}
