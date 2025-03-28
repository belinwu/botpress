import * as sdk from '@botpress/sdk'
import * as utils from '../../../utils'
import * as consts from '../../consts'
import { IntegrationTypingsModule } from '../../integration-implementation/integration-typings'
import { InterfaceTypingsModule } from '../../interface-implementation'
import { Module, ReExportTypeModule, SingleFileModule } from '../../module'
import { ActionsModule } from './actions-module'
import { DefaultConfigurationModule } from './configuration-module'
import { EventsModule } from './events-module'
import { StatesModule } from './states-module'
import { TablesModule } from './tables-module'
import { WorkflowsModule } from './workflows-module'

class PluginIntegrationsModule extends ReExportTypeModule {
  public constructor(plugin: sdk.PluginDefinition) {
    super({
      exportName: 'Integrations',
    })

    for (const [alias, integration] of Object.entries(plugin.integrations ?? {})) {
      const integrationModule = new IntegrationTypingsModule(integration.definition)
      integrationModule.unshift(alias)
      this.pushDep(integrationModule)
    }
  }
}

class PluginInterfacesModule extends ReExportTypeModule {
  public constructor(plugin: sdk.PluginDefinition) {
    super({
      exportName: 'Interfaces',
    })

    for (const [alias, intrface] of Object.entries(plugin.interfaces ?? {})) {
      const interfaceModule = new InterfaceTypingsModule(intrface.definition)
      interfaceModule.unshift(alias)
      this.pushDep(interfaceModule)
    }
  }
}

type PluginTypingsIndexDependencies = {
  integrationsModule: PluginIntegrationsModule
  interfacesModule: PluginInterfacesModule
  defaultConfigModule: DefaultConfigurationModule
  eventsModule: EventsModule
  statesModule: StatesModule
  actionsModule: ActionsModule
  tablesModule: TablesModule
  workflowsModule: WorkflowsModule
}

type _assertPropsInPluginDefinition = utils.types.AssertKeyOf<'props', sdk.PluginDefinition>
const _isLocalPluginDefinition = (
  plugin: sdk.PluginDefinition | sdk.PluginPackage['definition']
): plugin is sdk.PluginDefinition => {
  return 'props' in plugin
}

export class PluginTypingsModule extends Module {
  private _dependencies: PluginTypingsIndexDependencies

  public constructor(private _plugin: sdk.PluginDefinition | sdk.PluginPackage['definition']) {
    super({
      exportName: 'TPlugin',
      path: consts.INDEX_FILE,
    })

    const integrationsModule = _isLocalPluginDefinition(_plugin)
      ? new PluginIntegrationsModule(_plugin)
      : new SingleFileModule({
          path: consts.INDEX_FILE,
          exportName: 'Integrations',
          content: 'export type Integrations = {}',
        })
    integrationsModule.unshift('integrations')
    this.pushDep(integrationsModule)

    const interfacesModule = _isLocalPluginDefinition(_plugin)
      ? new PluginInterfacesModule(_plugin)
      : new SingleFileModule({
          path: consts.INDEX_FILE,
          exportName: 'Interfaces',
          content: 'export type Interfaces = {}',
        })
    interfacesModule.unshift('interfaces')
    this.pushDep(interfacesModule)

    const defaultConfigModule = new DefaultConfigurationModule(_plugin.configuration)
    defaultConfigModule.unshift('configuration')
    this.pushDep(defaultConfigModule)

    const eventsModule = new EventsModule(_plugin.events ?? {})
    eventsModule.unshift('events')
    this.pushDep(eventsModule)

    const statesModule = new StatesModule(_plugin.states ?? {})
    statesModule.unshift('states')
    this.pushDep(statesModule)

    const actionsModule = new ActionsModule(_plugin.actions ?? {})
    actionsModule.unshift('actions')
    this.pushDep(actionsModule)

    const tablesModule = new TablesModule(_plugin.tables ?? {})
    tablesModule.unshift('tables')
    this.pushDep(tablesModule)

    const workflowsModule = new WorkflowsModule(_plugin.workflows ?? {})
    workflowsModule.unshift('workflows')
    this.pushDep(workflowsModule)

    this._dependencies = {
      integrationsModule,
      interfacesModule,
      defaultConfigModule,
      eventsModule,
      statesModule,
      actionsModule,
      tablesModule,
      workflowsModule,
    }
  }

  public async getContent() {
    const {
      integrationsModule,
      interfacesModule,
      defaultConfigModule,
      eventsModule,
      statesModule,
      actionsModule,
      tablesModule,
      workflowsModule,
    } = this._dependencies

    const integrationsImport = integrationsModule.import(this)
    const interfacesImport = interfacesModule.import(this)
    const defaultConfigImport = defaultConfigModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const actionsImport = actionsModule
    const tablesImport = tablesModule.import(this)
    const workflowsImport = workflowsModule

    return [
      consts.GENERATED_HEADER,
      `import * as ${integrationsModule.name} from './${integrationsImport}'`,
      `import * as ${interfacesModule.name} from './${interfacesImport}'`,
      `import * as ${defaultConfigModule.name} from './${defaultConfigImport}'`,
      `import * as ${eventsModule.name} from './${eventsModule.name}'`,
      `import * as ${statesModule.name} from './${statesModule.name}'`,
      `import * as ${actionsModule.name} from './${actionsImport.name}'`,
      `import * as ${tablesModule.name} from './${tablesImport}'`,
      `import * as ${workflowsModule.name} from './${workflowsImport.name}'`,
      '',
      `export * as ${integrationsModule.name} from './${integrationsImport}'`,
      `export * as ${interfacesModule.name} from './${interfacesImport}'`,
      `export * as ${defaultConfigModule.name} from './${defaultConfigImport}'`,
      `export * as ${eventsModule.name} from './${eventsImport}'`,
      `export * as ${statesModule.name} from './${statesImport}'`,
      `export * as ${actionsModule.name} from './${actionsImport.name}'`,
      `export * as ${tablesModule.name} from './${tablesImport}'`,
      `export * as ${workflowsModule.name} from './${workflowsImport.name}'`,
      '',
      'export type TPlugin = {',
      `  name: "${this._plugin.name}"`,
      `  version: "${this._plugin.version}"`,
      `  integrations: ${integrationsModule.name}.${integrationsModule.exportName}`,
      `  interfaces: ${interfacesModule.name}.${interfacesModule.exportName}`,
      `  configuration: ${defaultConfigModule.name}.${defaultConfigModule.exportName}`,
      `  events: ${eventsModule.name}.${eventsModule.exportName}`,
      `  states: ${statesModule.name}.${statesModule.exportName}`,
      `  actions: ${actionsModule.name}.${actionsModule.exportName}`,
      `  tables: ${tablesModule.name}.${tablesModule.exportName}`,
      `  workflows: ${workflowsModule.name}.${workflowsModule.exportName}`,
      '}',
    ].join('\n')
  }
}
