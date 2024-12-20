import * as utils from '../../utils/type-utils'

type BaseChannel = {
  messages: Record<string, any>
}

type BaseAction = {
  input: any
  output: any
}

export type BaseInterface = {
  name: string
  version: string
  actions: Record<string, BaseAction>
  channels: Record<string, BaseChannel>
  events: Record<string, any>
  entities: Record<string, any>
}

type InputBaseChannel = utils.DeepPartial<BaseChannel>
type DefaultChannel<C extends InputBaseChannel> = {
  messages: utils.Default<C['messages'], BaseChannel['messages']>
}

export type InputBaseInterface = utils.DeepPartial<BaseInterface>
export type DefaultInterface<I extends InputBaseInterface> = {
  name: utils.Default<I['name'], BaseInterface['name']>
  version: utils.Default<I['version'], BaseInterface['version']>
  actions: utils.Default<I['actions'], BaseInterface['actions']>
  events: utils.Default<I['events'], BaseInterface['events']>
  entities: utils.Default<I['entities'], BaseInterface['entities']>
  channels: undefined extends I['channels']
    ? BaseInterface['channels']
    : {
        [K in keyof I['channels']]: DefaultChannel<utils.Cast<I['channels'][K], InputBaseChannel>>
      }
}
