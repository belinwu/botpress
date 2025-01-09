import axios from 'axios'
import { isBrowser } from 'browser-or-node'
import { apiVersion, Client as AutoGeneratedClient } from './gen/client'
import * as errors from './gen/client/errors'
import jwt from './jsonwebtoken'
import { SignalListener } from './signal-listener'
import * as types from './types'

const _100mb = 100 * 1024 * 1024
const maxBodyLength = _100mb
const maxContentLength = _100mb
const defaultTimeout = 60_000

const _createAuthClient = Symbol('_createAuthClient')

type Merge<A, B> = Omit<A, keyof B> & B
type IClient = Merge<
  {
    [K in types.ClientOperation]: (x: types.ClientRequests[K]) => Promise<types.ClientResponses[K]>
  },
  {
    listenConversation: (args: types.ClientRequests['listenConversation']) => Promise<SignalListener>
  }
>

type IAuthenticatedClient = Merge<
  {
    [K in types.AuthenticatedOperation]: (x: types.AuthenticatedClientRequests[K]) => Promise<types.ClientResponses[K]>
  },
  {
    listenConversation: (args: types.AuthenticatedClientRequests['listenConversation']) => Promise<SignalListener>
  }
>

const checkPayloadForError = <T>(response: object): T => {
  if (!('code' in response)) {
    return response as T
  }

  const { code } = response
  if (typeof code !== 'number') {
    return response as T
  }

  if (code < 400 || code >= 600) {
    return response as T
  }

  const message = JSON.stringify(response)
  throw new errors.UnknownError(message)
}

const wrapAutoClient = (client: AutoGeneratedClient): AutoGeneratedClient =>
  new Proxy<AutoGeneratedClient>(client, {
    get(target, prop) {
      const fn = target[prop as keyof AutoGeneratedClient]
      return async (args: any) => {
        const response = await fn.call(target, args)
        return checkPayloadForError(response)
      }
    },
  })

export class Client implements IClient {
  private _auto: AutoGeneratedClient

  public constructor(public readonly props: Readonly<types.ClientProps>) {
    const axiosClient = Client._createAxios(props)
    this._auto = wrapAutoClient(new AutoGeneratedClient(axiosClient))
  }

  public get apiVersion() {
    return apiVersion
  }

  /**
   * Gets or creates a user based on the provided props and returns an authenticated client.
   */
  public static async connect(props: types.ConnectProps): Promise<AuthenticatedClient> {
    const { userId, userKey, encryptionKey, ...clientProps } = props
    const client = new Client(clientProps)

    if (userKey) {
      const { user } = await client.getOrCreateUser({ 'x-user-key': userKey })
      return AuthenticatedClient[_createAuthClient](client, { ...user, key: userKey })
    }

    if (encryptionKey) {
      if (!jwt) {
        const message =
          'Connecting with an encryption key is not supported in the browser; use in NodeJs or format the key manually with jsonwebtoken.'
        throw new Error(message)
      }

      if (!userId) {
        throw new Error(
          'userId is required when connecting with an encryption key. You may pick any userId of your choice that is not already taken by another user.'
        )
      }

      const userKey = jwt.sign({ id: userId }, encryptionKey, { algorithm: 'HS256' })
      const { user } = await client.getOrCreateUser({ 'x-user-key': userKey })
      return AuthenticatedClient[_createAuthClient](client, { ...user, key: userKey })
    }

    const { user, key } = await client.createUser({ id: userId })
    return AuthenticatedClient[_createAuthClient](client, { ...user, key })
  }

  public readonly createConversation: IClient['createConversation'] = (x) => this._auto.createConversation(x)
  public readonly getConversation: IClient['getConversation'] = (x) => this._auto.getConversation(x)
  public readonly getOrCreateConversation: IClient['getOrCreateConversation'] = (x) =>
    this._auto.getOrCreateConversation(x)
  public readonly deleteConversation: IClient['deleteConversation'] = (x) => this._auto.deleteConversation(x)
  public readonly listConversations: IClient['listConversations'] = (x) => this._auto.listConversations(x)
  public readonly listMessages: IClient['listMessages'] = (x) => this._auto.listMessages(x)
  public readonly addParticipant: IClient['addParticipant'] = (x) => this._auto.addParticipant(x)
  public readonly removeParticipant: IClient['removeParticipant'] = (x) => this._auto.removeParticipant(x)
  public readonly getParticipant: IClient['getParticipant'] = (x) => this._auto.getParticipant(x)
  public readonly listParticipants: IClient['listParticipants'] = (x) => this._auto.listParticipants(x)
  public readonly createMessage: IClient['createMessage'] = (x) => this._auto.createMessage(x)
  public readonly getMessage: IClient['getMessage'] = (x) => this._auto.getMessage(x)
  public readonly deleteMessage: IClient['deleteMessage'] = (x) => this._auto.deleteMessage(x)
  public readonly createUser: IClient['createUser'] = (x) => this._auto.createUser(x)
  public readonly getUser: IClient['getUser'] = (x) => this._auto.getUser(x)
  public readonly getOrCreateUser: IClient['getOrCreateUser'] = (x) => this._auto.getOrCreateUser(x)
  public readonly updateUser: IClient['updateUser'] = (x) => this._auto.updateUser(x)
  public readonly deleteUser: IClient['deleteUser'] = (x) => this._auto.deleteUser(x)
  public readonly createEvent: IClient['createEvent'] = (x) => this._auto.createEvent(x)
  public readonly getEvent: IClient['getEvent'] = (x) => this._auto.getEvent(x)

  public readonly listenConversation: IClient['listenConversation'] = async ({ id, 'x-user-key': userKey }) => {
    const signalListener = await SignalListener.listen({
      url: this.props.apiUrl,
      conversationId: id,
      userKey,
      debug: this.props.debug ?? false,
    })
    return signalListener
  }

  private static _createAxios = (props: types.ClientProps) => {
    const headers: types.Headers = {
      ...props.headers,
    }
    const timeout = props.timeout ?? defaultTimeout
    const withCredentials = isBrowser
    const { apiUrl: baseURL } = props
    return axios.create({
      baseURL,
      headers,
      withCredentials,
      timeout,
      maxBodyLength,
      maxContentLength,
      validateStatus: (status) => status >= 200 && status < 400,
    })
  }
}

export class AuthenticatedClient implements IAuthenticatedClient {
  private constructor(
    private _client: Client,
    public readonly user: types.AuthenticatedUser
  ) {}

  // can not be instantiated outside of this module
  public static [_createAuthClient] = (client: Client, user: types.AuthenticatedUser) => {
    return new AuthenticatedClient(client, user)
  }

  public get apiVersion() {
    return this._client.apiVersion
  }

  public readonly createConversation: IAuthenticatedClient['createConversation'] = (x) =>
    this._client.createConversation({ 'x-user-key': this.user.key, ...x })
  public readonly getConversation: IAuthenticatedClient['getConversation'] = (x) =>
    this._client.getConversation({ 'x-user-key': this.user.key, ...x })
  public readonly getOrCreateConversation: IAuthenticatedClient['getOrCreateConversation'] = (x) =>
    this._client.getOrCreateConversation({ 'x-user-key': this.user.key, ...x })
  public readonly deleteConversation: IAuthenticatedClient['deleteConversation'] = (x) =>
    this._client.deleteConversation({ 'x-user-key': this.user.key, ...x })
  public readonly listConversations: IAuthenticatedClient['listConversations'] = (x) =>
    this._client.listConversations({ 'x-user-key': this.user.key, ...x })
  public readonly listMessages: IAuthenticatedClient['listMessages'] = (x) =>
    this._client.listMessages({ 'x-user-key': this.user.key, ...x })
  public readonly listenConversation: IAuthenticatedClient['listenConversation'] = (x) =>
    this._client.listenConversation({ 'x-user-key': this.user.key, ...x })
  public readonly addParticipant: IAuthenticatedClient['addParticipant'] = (x) =>
    this._client.addParticipant({ 'x-user-key': this.user.key, ...x })
  public readonly removeParticipant: IAuthenticatedClient['removeParticipant'] = (x) =>
    this._client.removeParticipant({ 'x-user-key': this.user.key, ...x })
  public readonly getParticipant: IAuthenticatedClient['getParticipant'] = (x) =>
    this._client.getParticipant({ 'x-user-key': this.user.key, ...x })
  public readonly listParticipants: IAuthenticatedClient['listParticipants'] = (x) =>
    this._client.listParticipants({ 'x-user-key': this.user.key, ...x })
  public readonly createMessage: IAuthenticatedClient['createMessage'] = (x) =>
    this._client.createMessage({ 'x-user-key': this.user.key, ...x })
  public readonly getMessage: IAuthenticatedClient['getMessage'] = (x) =>
    this._client.getMessage({ 'x-user-key': this.user.key, ...x })
  public readonly deleteMessage: IAuthenticatedClient['deleteMessage'] = (x) =>
    this._client.deleteMessage({ 'x-user-key': this.user.key, ...x })
  public readonly getUser: IAuthenticatedClient['getUser'] = (x) =>
    this._client.getUser({ 'x-user-key': this.user.key, ...x })
  public readonly updateUser: IAuthenticatedClient['updateUser'] = (x) =>
    this._client.updateUser({ 'x-user-key': this.user.key, ...x })
  public readonly deleteUser: IAuthenticatedClient['deleteUser'] = (x) =>
    this._client.deleteUser({ 'x-user-key': this.user.key, ...x })
  public readonly createEvent: IAuthenticatedClient['createEvent'] = (x) =>
    this._client.createEvent({ 'x-user-key': this.user.key, ...x })
  public readonly getEvent: IAuthenticatedClient['getEvent'] = (x) =>
    this._client.getEvent({ 'x-user-key': this.user.key, ...x })
}
