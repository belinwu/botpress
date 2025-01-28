import { RulesetFunctionContext } from '@stoplight/spectral-core'

type MessageFn = ({ path }: { path: (string | number)[] }) => string

/**
 * When the input is falsy, return a message that is generated by the provided function
 */
export const truthyWithMessage = (fn: MessageFn) => (input: string, _: unknown, context: RulesetFunctionContext) => {
  const messages = []

  if (!input) {
    const message = fn({ path: context.path })
    messages.push({ message })
  }

  return messages
}

/**
 * When the input does not match the pattern, return a message that is generated by the provided function
 */
export const patternWithMessage =
  (pattern: RegExp, fn: MessageFn) => (input: string, _: unknown, context: RulesetFunctionContext) => {
    const messages = []

    if (!pattern.test(input)) {
      const message = fn({ path: context.path })
      messages.push({ message })
    }

    return messages
  }
