import * as sdk from '@botpress/sdk'
import hitl from './bp_modules/hitl'

export default new sdk.PluginDefinition({
  name: 'hitl',
  version: '0.0.1',
  configuration: {
    schema: sdk.z.object({}),
  },
  actions: {
    startHitl: {
      title: 'Start HITL',
      description: 'Starts the HITL mode',
      input: {
        schema: sdk.z.object({
          title: sdk.z.string(),
          description: sdk.z.string().optional(),
          userId: sdk.z.string(),
          conversationId: sdk.z.string(),
        }),
      },
      output: { schema: sdk.z.object({}) },
    },
    stopHitl: {
      title: 'Stop HITL',
      description: 'Stop the HITL mode',
      input: {
        schema: sdk.z.object({
          userId: sdk.z.string(),
          conversationId: sdk.z.string(),
        }),
      },
      output: { schema: sdk.z.object({}) },
    },
  },
  states: {
    hitl: {
      type: 'conversation',
      schema: sdk.z.object({
        hitlActive: sdk.z.boolean().title('HITL Enabled').describe('Whether the bot is in HITL mode'),
      }),
    },
  },
  user: {
    tags: {
      downstream: {
        title: 'Downstream User ID',
        description: 'ID of the downstream user binded to the upstream one',
      },
      upstream: {
        title: 'Upstream User ID',
        description: 'ID of the upstream user binded to the downstream one',
      },
    },
  },
  conversation: {
    tags: {
      downstream: {
        title: 'Downstream Conversation ID',
        description: 'ID of the downstream conversation binded to the upstream one',
      },
      upstream: {
        title: 'Upstream Conversation ID',
        description: 'ID of the upstream conversation binded to the downstream one',
      },
    },
  },
  interfaces: {
    hitl,
  },
})
