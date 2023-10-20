declare namespace RtmStatusCode {
    enum ConnectionChangeReason {
        LOGIN = "LOGIN",
        LOGIN_SUCCESS = "LOGIN_SUCCESS",
        LOGIN_FAILURE = "LOGIN_FAILURE",
        LOGIN_TIMEOUT = "LOGIN_TIMEOUT",
        INTERRUPTED = "INTERRUPTED",
        LOGOUT = "LOGOUT",
        BANNED_BY_SERVER = "BANNED_BY_SERVER",
        REMOTE_LOGIN = "REMOTE_LOGIN",
        TOKEN_EXPIRED = "TOKEN_EXPIRED"
    }
    enum ConnectionState {
        DISCONNECTED = "DISCONNECTED",
        CONNECTING = "CONNECTING",
        CONNECTED = "CONNECTED",
        RECONNECTING = "RECONNECTING",
        ABORTED = "ABORTED"
    }
    enum LocalInvitationState {
        IDLE = "IDLE",
        SENT_TO_REMOTE = "SENT_TO_REMOTE",
        RECEIVED_BY_REMOTE = "RECEIVED_BY_REMOTE",
        ACCEPTED_BY_REMOTE = "ACCEPTED_BY_REMOTE",
        REFUSED_BY_REMOTE = "REFUSED_BY_REMOTE",
        CANCELED = "CANCELED",
        FAILURE = "FAILURE"
    }
    enum RemoteInvitationState {
        INVITATION_RECEIVED = "INVITATION_RECEIVED",
        ACCEPT_SENT_TO_LOCAL = "ACCEPT_SENT_TO_LOCAL",
        REFUSED = "REFUSED",
        ACCEPTED = "ACCEPTED",
        CANCELED = "CANCELED",
        FAILURE = "FAILURE"
    }
    enum LocalInvitationFailureReason {
        UNKNOWN = "UNKNOWN",
        PEER_NO_RESPONSE = "PEER_NO_RESPONSE",
        INVITATION_EXPIRE = "INVITATION_EXPIRE",
        PEER_OFFLINE = "PEER_OFFLINE",
        NOT_LOGGEDIN = "NOT_LOGGEDIN"
    }
    enum RemoteInvitationFailureReason {
        UNKNOWN = "UNKNOWN",
        PEER_OFFLINE = "PEER_OFFLINE",
        ACCEPT_FAILURE = "ACCEPT_FAILURE",
        INVITATION_EXPIRE = "INVITATION_EXPIRE"
    }
    enum PeerOnlineState {
        ONLINE = "ONLINE",
        UNREACHABLE = "UNREACHABLE",
        OFFLINE = "OFFLINE"
    }
    enum PeerSubscriptionOption {
        ONLINE_STATUS = "ONLINE_STATUS"
    }
    enum MessageType {
        TEXT = "TEXT",
        RAW = "RAW"
    }
    enum LegacyAreaCode {
        CN = "CN",
        NA = "NA",
        EU = "EU",
        AS = "AS",
        JP = "JP",
        IN = "IN",
        GLOB = "GLOB",
        OC = "OC",
        SA = "SA",
        AF = "AF",
        OVS = "OVS"
    }
    enum AreaCode {
        GLOBAL = "GLOBAL",
        INDIA = "INDIA",
        JAPAN = "JAPAN",
        ASIA = "ASIA",
        EUROPE = "EUROPE",
        CHINA = "CHINA",
        NORTH_AMERICA = "NORTH_AMERICA"
    }
}

/** @zh-cn
 * 管理频道属性。
 */
/**
 * Manages channel attributes.
 */
interface ChannelAttributeProperties {
  /** @zh-cn
   * 频道属性的属性值。长度不得超过 8 KB。
   */
  /**
   * The value of the channel attribute. Must not exceed 8 KB in length.
   */
  value: string;

  /** @zh-cn
   * 最近一次更新频道属性用户的 ID。
   */
  /**
   * User ID of the user who makes the latest update to the channel attribute.
   */
  lastUpdateUserId: string;

  /** @zh-cn
   * 频道属性最近一次更新的时间戳（毫秒）。
   */
  /**
   * Timestamp of when the channel attribute was last updated in milliseconds.
   */
  lastUpdateTs: number;
}

/** @zh-cn
 * 定义属性。
 */
/**
 * Defines attributes.
 */
interface AttributesMap {

  /** @zh-cn
  * 属性名和属性值，以键值对形式表示。单个属性值的长度不得超过 8 KB。单个属性名长度不得超过 32 字节。
  */
  /**
   * Attribute name and attribute value in the form of a key value pair. The total length of an attribute value must not exceed 8 KB. The length of a single attribute name must not exceed 32 bytes.
   */
  [key: string]: string;
}
/** @zh-cn
 * 定义频道属性。
 */
/**
 * Defines channel attributes.
 */
interface ChannelAttributes {
  /** @zh-cn
   * 频道属性名和频道属性健值对。
   */
  [key: string]: ChannelAttributeProperties;
}

/** @zh-cn
 * 维护频道属性操作相关选项。
 */
/**
 * An interface for setting and getting channel attribute options.
 */
interface ChannelAttributeOptions {
  /** @zh-cn
   * 是否通知所有频道成员本次频道属性变更。该标志位仅对本次 API 调用有效：
   * 
   * - `true`: 通知所有频道成员本次频道属性变更。
   * - `false`: (默认) 不通知所有频道成员本次频道属性变更。
   */
  /**
   * Indicates whether or not to notify all channel members of a channel attribute change. This flag is valid only within the current method call:
   * 
   * - `true`: Notify all channel members of a channel attribute change.
   * - `false`: (Default) Do not notify all channel members of a channel attribute change.
   */
  enableNotificationToChannelMembers?: boolean;
}

/** @hidden */
declare type ListenerType<T> = [T] extends [(...args: infer U) => any]
  ? U
  : [T] extends [void]
  ? []
  : [T];
/** @hidden */
declare class EventEmitter<TEventRecord = {}> {
  static defaultMaxListeners: number;
  on<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: ListenerType<TEventRecord[P]>) => void
  ): this;

  once<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: ListenerType<TEventRecord[P]>) => void
  ): this;

  off<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: any[]) => any
  ): this;

  removeAllListeners<P extends keyof TEventRecord, T>(this: T, event?: P): this;
  listeners<P extends keyof TEventRecord, T>(this: T, event: P): Function[];
  rawListeners<P extends keyof TEventRecord, T>(this: T, event: P): Function[];
  listenerCount<P extends keyof TEventRecord, T>(this: T, event: P): number;
}

/** @zh-cn
 * 文本消息接口，用于发送和接收文本消息。你可以调用 {@link RtmClient.sendMessageToPeer} 或 {@link RtmChannel.sendMessage} 发送点对点类型或频道类型的文本消息。
 */
/**
 * Interface for text messages. You can use this interface to send and receive text messages. You can call {@link RtmClient.sendMessageToPeer} or {@link RtmChannel.sendMessage} to send a peer-to-peer or channel text message.
 */
interface RtmTextMessage {
  /** @zh-cn
   * 文本消息的内容。最大长度为 32 KB。
   * <p><b>Note</b></p>
   * 文本消息和文字描述的总大小不能超过 32 KB。
   */
  /**
   * Content of the text message. The maximum length is 32 KB.
   * <p><b>Note</b></p>
   * The maximum total length of the text message and the description is 32 KB.
   */
  text: string;

  /** @zh-cn
   * 消息类型。`TEXT` 代表文本消息。
   */
  /**
   * Message type. `TEXT` stands for text messages.
   *
   */
  messageType?: 'TEXT';
  /** @hidden */
  rawMessage?: never;
  /** @hidden */
  description?: never;
}

/** @zh-cn
 * 二进制消息接口，用于发送和接收二进制消息。你可以调用 {@link RtmClient.sendMessageToPeer} 或 {@link RtmChannel.sendMessage} 发送点对点或频道的二进制消息。
 */
/**
 * Interface for raw messages. You can use this interface to send and receive raw messages. You can call {@link RtmClient.sendMessageToPeer} or {@link RtmChannel.sendMessage} to send a peer-to-peer or channel raw message.
 */
interface RtmRawMessage {
  /** @zh-cn
   * 二进制消息的内容。最大长度为 32 KB。
   * <p><b>Note</b></p>
   * 二进制消息和文字描述的总大小不能超过 32 KB。
   */
  /**
   * Content of the raw message in binary format. The maximum length is 32 KB.
   * <p><b>Note</b></p>
   * The maximum total length of the raw message and the description is 32 KB.
   */
  rawMessage: Uint8Array;

  /** @zh-cn
   * 二进制消息的文字描述。最大长度为 32 KB。
   * <p><b>Note</b></p>
   * 二进制消息和文字描述的总大小不能超过 32 KB。
   */
  /**
   * Description of the raw message. The maximum length is 32 KB.
   * <p><b>Note</b></p>
   * The maximum total length of the raw message and the description is 32 KB.
   */
  description?: string;

  /** @zh-cn
   * 消息类型。`RAW` 代表二进制消息。
   */
  /**
   * Message type. `RAW` stands for raw messages.
   *
   */
  messageType?: 'RAW';
  /** @hidden */
  text?: never;
}


/** @zh-cn
 * 用于表示 RTM 消息的类型别名。RtmMessage 可以是文本消息 {@link RtmTextMessage} ，自定义二进制消息 {@link RtmRawMessage}。
 */
/**
 * Type alias for RTM messages. RtmMessage can be either {@link RtmTextMessage} , {@link RtmRawMessage}.
 */
type RtmMessage =
  | RtmTextMessage
  | RtmRawMessage;

/** @zh-cn
 * 用于表示点对点消息发送结果的接口。
 */
/**
 * Interface for the result of delivering the peer-to-peer message.
 */
interface PeerMessageSendResult {
  /** @zh-cn
   * 该布尔值属性代表消息接收方是否已收到发出的消息。
   *
   * - `true`: 点对点消息发送成功，对方已收到；
   * - `false`: 对方不在线，未收到该消息。
   *
   */
  /**
   * This boolean property indicates whether the remote peer user receives the sent message.
   *
   * - `true`: the peer user receives the message.
   * - `false`: the peer user is offline and does not receive the message.
   *
   */
  hasPeerReceived: boolean;
}



/** @zh-cn
 * 用于管理已接收消息属性的接口。
 */
/**
 * Interface for properties of received messages.
 */
interface ReceivedMessageProperties {
  /** @zh-cn
   * 消息服务器接收到消息的时间戳，单位为毫秒。
   *
   * <p><b>Note</b></p>
   *
   * <li> 你不能设置时间戳，但是你可以从该时间戳推断出消息的<i>大致</i>发送时间。</li>
   * <li> 时间戳的精度为毫秒。仅用于展示，不建议用于消息的严格排序。</li>
   */
  /**
   * The timestamp (ms) of when the messaging server receives this message.
   *
   * <p><b>Note</b></p>
   *
   * <li> You cannot set this returned timestamp, but you can infer from it the <i>approximate</i> time as to when this message was sent.</li>
   * <li> The returned timestamp is on a millisecond time-scale. It is for demonstration purposes only, not for strict ordering of messages.</li>
   */
  serverReceivedTs: number;
}

interface PeersOnlineStatusMap {
  [peerId: string]: RtmStatusCode.PeerOnlineState;
}

declare namespace RtmEvents {
  /** @zh-cn
   * {@link RtmChannel} 实例上的事件类型。
   * 该接口中，函数属性的名称为事件名称，函数的参数为事件监听回调的传入参数。
   *
   * @example **监听频道消息**
   *
   * ```JavaScript
   * channel.on('ChannelMessage', function (message, memberId) {
   *   // 你的代码：收到频道消息。
   * });
   * ```
   * @example **监听用户加入频道事件**
   *
   * ```JavaScript
   * channel.on('MemberJoined', memberId => {
   * // 你的代码：用户已加入频道。
   * })
   * ```
   * @example **监听用户离开频道事件**
   *
   * ```JavaScript
   * channel.on('MemberLeft', memberId => {
   *   // 你的代码：用户已离开频道。
   * });
   * ```
   */
  /**
   * Event types of the {@link RtmChannel} instance.
   * In this interface, the function property’s name is the event name; the function property’s parameters is the parameters of the event listener function.
   *
   * @example **Listening to channel messages.**
   *
   * ```JavaScript
   * channel.on('ChannelMessage', function (message, memberId) {
   *   // Your code.
   * });
   * ```
   * @example **Listening to events, such as a user joining the channel.**
   *
   * ```JavaScript
   * channel.on('MemberJoined', memberId => {
   * // Your code.
   * })
   * ```
   * @example **Listening to events, such as a member leaving the channel**
   *
   * ```JavaScript
   * channel.on('MemberLeft', memberId => {
   *   // Your code.
   * });
   * ```
   */
  export interface RtmChannelEvents {
    /** @zh-cn
     * 收到频道消息的事件通知。
     * @event
     * @param message 接收到的频道消息对象。
     * @param memberId 该频道消息的发送者 uid。
     */
    /**
     * Occurs when the local user receives a channel message.
     * @event
     * @param message The received channel message object.
     * @param memberId The uid of the sender.
     */
    ChannelMessage: (
      message: RtmMessage,
      memberId: string,
      messagePros: ReceivedMessageProperties
    ) => void;

    /** @zh-cn
     * 收到用户离开频道的通知。
     *
     * 用户调用 `leave` 方法离开频道或者由于网络原因与 Agora RTM 系统断开连接达到 30 秒都会触发此回调。
     *
     * 当频道成员超过 512 时，该回调失效。
     * @event
     * @param memberId 离开频道的远端用户的 uid。
     */
    /**
     * Occurs when a user leaves the channel.
     *
     * This callback is triggered when the user calls `leave` to leave a channel or the user stays disconnected with the Agora RTM system for 30 seconds due to network issues.
     *
     * <p><b>Note</b></p>
     * This callback is disabled when the number of the channel members exceeds 512.
     * @event
     * @param memberId The uid of the user leaving the channel.
     */
    MemberLeft: (memberId: string) => void;

    /** @zh-cn
     * 收到用户加入频道的通知。
     * <p><b>Note</b></p>
     * 当频道成员超过 512 时，该回调失效。
     * @event
     * @param memberId 加入频道的用户的 uid。
     */
    /**
     * Occurs when a user joins a channel.
     * <p><b>Note</b></p>
     * This callback is disabled when the number of the channel members exceeds 512.
     * @event
     * @param memberId The uid of the user joining the channel.
     */
    MemberJoined: (memberId: string) => void;

    /** @zh-cn
     * 频道属性更新回调。返回所在频道的所有属性。
     *
     * <p><b>Note</b></p>
     * 只有当频道属性更新者将 {@link enableNotificationToChannelMembers} 设为 `true` 后，该回调才会被触发。请注意：该标志位仅对当前频道属性操作有效。
     * @event
     */
    /**
     * Occurs when channel attributes are updated, and returns all attributes of the channel.
     *
     * <p><b>Note</b></p>
     * This callback is enabled only when the user, who updates the attributes of the channel, sets {@link enableNotificationToChannelMembers} as true. Also note that this flag is valid only within the current channel attribute method call.
     * @event
     */
    AttributesUpdated: (attributes: ChannelAttributes) => void;
    /** @zh-cn
     * 收到频道人数变化通知。
     * @event
     */

    /** @zh-cn
     * 频道成员人数更新回调。返回最新频道成员人数。
     *
     * <p><b>Note</b></p>
     *
     * <li> 频道成员人数 &le; 512 时，触发频率为每秒 1 次。</li>
     * <li> 频道成员人数超过 512 时，触发频率为每 3 秒 1 次。</li>
     * <li> 用户在成功加入频道时会收到该回调。你可以通过监听该回调获取加入频道时的频道成员人数和后继人数更新。</li></ul>
     * @event
     * @param memberCount 最新频道成员人数。
     */
    /**
     * Occurs when the number of the channel members changes, and returns the new number.
     *
     * <p><b>Note</b></p>
     *
     * <li> When the number of channel members &le; 512, the SDK returns this callback when the number changes at a frequency of once per second. </li>
     * <li> When the number of channel members exceeds 512, the SDK returns this callback when the number changes at a frequency of once every three seconds. </li>
     * <li> You will receive this callback when successfully joining an RTM channel, so we recommend implementing this callback to receive timely updates on the number of the channel members.</li></ul>
     * @event
     * @param memberCount Member count of this channel.
     */
    MemberCountUpdated: (memberCount: number) => void;
  }

  /** @zh-cn
   * {@link RemoteInvitation} 实例上的事件类型。
   */
  /**
   * Event types of the {@link RemoteInvitation} instance.
   */
  export interface RemoteInvitationEvents {
    /** @zh-cn
     * 返回给被叫：主叫已取消呼叫邀请。
     */
    /**
     * Callback to the callee: occurs when the caller cancels the call invitation.
     */
    RemoteInvitationCanceled: (content: string) => void;

    /** @zh-cn
     * 返回给被叫：拒绝呼叫邀请成功。
     */
    /**
     * Callback for the callee: occurs when the callee successfully declines the incoming call invitation.
     */
    RemoteInvitationRefused: () => void;

    /** @zh-cn
     * 返回给被叫：接受呼叫邀请成功。
     */
    /**
     * Callback to the callee: occurs when the callee accepts a call invitation.
     */
    RemoteInvitationAccepted: () => void;

    /** @zh-cn
     * 返回给被叫：呼叫邀请进程失败。
     * @param reason 呼叫邀请失败原因。详见： {@link RemoteInvitationFailureReason} 。
     */
    /**
     * Callback to the callee: occurs when the life cycle of the incoming call invitation ends in failure.
     *
     * @param reason See: {@link RemoteInvitationFailureReason}.
     */
    RemoteInvitationFailure: (
      reason: RtmStatusCode.RemoteInvitationFailureReason
    ) => void;
  }

  /** @zh-cn
   * {@link LocalInvitation} 实例上的事件类型。
   */
  /**
   * Event types of the {@link LocalInvitation} instance.
   */
  export interface LocalInvitationEvents {
    /** @zh-cn
     * 返回给主叫：被叫已接受呼叫邀请。
     *
     * @param response 被叫设置的响应内容。
     */
    /**
     * Callback to the caller: occurs when the callee accepts the call invitation.
     *
     * @param response The response from the callee.
     */
    LocalInvitationAccepted: (response: string) => void;
    /** @zh-cn
     * 返回给主叫：被叫已拒绝呼叫邀请。
     * @param response 被叫设置的响应内容。
     */
    /**
     * Callback to the caller: occurs when the callee refuses the call invitation.
     * @param response The response from the callee.
     */
    LocalInvitationRefused: (response: string) => void;
    /** @zh-cn
     * 返回给主叫：被叫已收到呼叫邀请。
     */
    /**
     * Callback to the caller: occurs when the callee receives the call invitation.
     *
     * This callback notifies the caller that the callee receives the call invitation.
     */
    LocalInvitationReceivedByPeer: () => void;
    /** @zh-cn
     * 返回给主叫：呼叫邀请已被成功取消。
     */
    /**
     * Callback to the caller: occurs when the caller cancels a call invitation.
     * This callback notifies the caller that he/she has canceled a call invitation.
     */
    LocalInvitationCanceled: () => void;
    /** @zh-cn
     * 返回给主叫：呼叫邀请进程失败。
     *
     * @param reason 呼叫邀请的失败原因。详见： {@link LocalInvitationFailureReason} 。
     */
    /**
     * Callback to the caller: occurs when the outgoing call invitation ends in failure.
     *
     * @param reason See: {@link LocalInvitationFailureReason}.
     */
    LocalInvitationFailure: (
      reason: RtmStatusCode.LocalInvitationFailureReason
    ) => void;
  }

  /** @zh-cn
   * {@link RtmClient} 实例上的事件类型。
   * 该接口中，函数属性的名称为事件名称，函数的参数为事件监听回调的传入参数。
   *
   * @example **监听点对点消息**
   *
   * ```JavaScript
   * client.on('MessageFromPeer', function (message, peerId) {
   *   // Your code.
   * });
   * ```
   */
  /**
   * Event listener type of the {@link RtmClient} instance.
   * In this interface, the function property’s name is the event name; the function property’s parameters is the parameters of the event listener function.
   *
   * @example **Listening to peer-to-peer messages.**
   *
   * ```JavaScript
   * client.on('MessageFromPeer', function (message, peerId) {
   *   // Your code.
   * });
   * ```
   */
  export interface RtmClientEvents {
    /** @zh-cn
     * 收到来自对端的点对点消息。
     * @event
     * @param message 远端用户发送的消息对象。
     * @param peerId 发送该消息的远端用户 uid。
     * @param messageProps 接收到的消息的属性。
     */
    /**
     * Occurs when the local user receives a peer-to-peer message from a remote user.
     * @event
     * @param message The received peer-to-peer message object.
     * @param peerId The uid of the sender.
     * @param messageProps The properties of the received message.
     */
    MessageFromPeer: (
      message: RtmMessage,
      peerId: string,
      messageProps: ReceivedMessageProperties
    ) => void;
    /** @zh-cn
     * 通知 SDK 与 Agora RTM 系统的连接状态发生了改变。
     * @event
     * @param newState 新的连接状态
     * @param reason 状态改变的原因
     */
    /**
     * Occurs when the connection state changes between the SDK and the Agora RTM system.
     * @event
     * @param newState The new connection state.
     * @param reason Reasons for the connection state change.
     */
    ConnectionStateChanged: (
      newState: RtmStatusCode.ConnectionState,
      reason: RtmStatusCode.ConnectionChangeReason
    ) => void;
    /** @zh-cn
     * 收到来自主叫的呼叫邀请。
     * @event
     * @param remoteInvitation 一个 {@link RemoteInvitation} 对象。
     */
    /**
     * Occurs when the callee receives a call invitation from a remote user (caller).
     * @event
     * @param remoteInvitation A {@link RemoteInvitation} object.
     */
    RemoteInvitationReceived: (remoteInvitation: RemoteInvitation) => void;

    /** @zh-cn
     * （SDK 断线重连时触发）当前使用的 RTM Token 已超过 24 小时的签发有效期。
     *
     * - 该回调仅会在 SDK 处于 `RECONNECTING` 状态时因 RTM 后台监测到 Token 签发有效期过期而触发。SDK 处于 `CONNECTED` 状态时该回调不会被触发。
     * - 收到该回调时，请尽快在你的业务服务端生成新的 Token 并调用 {@link renewToken} 方法把新的 Token 传给 Token 验证服务器。
     */
    /**
     * Occurs when the RTM server detects that the RTM token has exceeded the 24-hour validity period and when the SDK is in the `RECONNECTING` state.
     *
     * - This callback occurs only when the SDK is reconnecting to the server. You will not receive this callback when the SDK is in the `CONNECTED` state.
     * - When receiving this callback, generate a new RTM Token on the server and call the {@link renewToken} method to pass the new Token on to the server.
     */
    TokenExpired: () => void;

    /** @zh-cn
     *   当前使用的 RTM Token 登录权限还有 30 秒就会超过签发有效期。
     *
     * - 收到该回调时，请尽快在你的业务服务端生成新的 Token 并调用 {@link renewToken} 方法把新的 Token 传给 Token 验证服务器。
     */
    /**
     * The currently used RTM Token login permission will expire after 30 seconds.
     *
     * - When receiving this callback, generate a new RTM Token on the server and call the {@link renewToken} method to pass the new Token on to the server.
     */
    TokenPrivilegeWillExpire: () => void;

    /** @zh-cn
     * 被订阅用户在线状态改变回调。
     *
     * - 首次订阅在线状态成功时，SDK 也会返回本回调，显示所有被订阅用户的在线状态。
     * - 每当被订阅用户的在线状态发生改变，SDK 都会通过该回调通知订阅方。
     * - 如果 SDK 在断线重连过程中有被订阅用户的在线状态发生改变，SDK 会在重连成功时通过该回调通知订阅方。
     */
    /**
     * Occurs when the online status of the peers, to whom you subscribe, changes.
     *
     * - When the subscription to the online status of specified peer(s) succeeds, the SDK returns this callback to report the online status of peers, to whom you subscribe.
     * - When the online status of the peers, to whom you subscribe, changes, the SDK returns this callback to report whose online status has changed.
     * - If the online status of the peers, to whom you subscribe, changes when the SDK is reconnecting to the server, the SDK returns this callback to report whose online status has changed when successfully reconnecting to the server.
     */
    PeersOnlineStatusChanged: (status: PeersOnlineStatusMap) => void;

    /**
     * Occurs when the SDK automatically switches to proxy WebSocket of 443 port.
     */
    FallbackProxyConnected: () => void;
  }
}

/** @zh-cn
 * 由主叫通过 {@link createLocalInvitation} 方法创建，仅供主叫调用的呼叫邀请对象。
 * @noInheritDoc
 */
/**
 * The call invitation object created by calling the {@link createLocalInvitation} method, and called only by the caller.
 * @noInheritDoc
 */
declare class LocalInvitation extends EventEmitter<
  RtmEvents.LocalInvitationEvents
> {
  /** @zh-cn
   * 被叫设置的响应内容。
   * @readonly
   */
  /**
   * The callee's response to the call invitation.
   * @readonly
   */
  readonly response: string;

  /**
   * 供主叫查看的呼叫邀请状态。
   *
   * 详见: {@link LocalInvitationState} 。
   * @readonly
   */
  /**
   * State of the outgoing call invitation.
   *
   * See: {@link LocalInvitationState}.
   * @readonly
   */
  readonly state: RtmStatusCode.LocalInvitationState;

  /** @zh-cn
   * 主叫设置的呼叫邀请内容。
   * @note 最大长度为 8 KB。
   */
  /**
   * Call invitation content set by the caller.
   * @note The maximum length is 8 KB.
   */
  content: string;

  /** @zh-cn
   * 被叫的 uid。
   */
  /**
   * uid of the callee.
   */
  readonly calleeId: string;

  /** @zh-cn
   * 主叫设置的频道 ID。
   * @note 与老信令 SDK 互通时你必须设置频道 ID。不过即使在被叫成功接受呼叫邀请后，Agora RTM SDK 也不会把主叫加入指定频道。
   */
  /**
   * The channel ID set by the caller.
   * @note To intercommunicate with the legacy Agora Signaling SDK, you MUST set the channel ID. However, even if the callee successfully accepts the call invitation, the Agora RTM SDK does not join the channel of the specified channel ID.
   */
  channelId: string;

  /** @zh-cn
   * 向指定用户（被叫）发送呼叫邀请。该方法无异步回调。如需监听 {@link LocalInvitationState} 变化，请通过 {@link on} 方法注册 {@link LocalInvitationEvents} 中的事件回调。
   */
  /**
   * Send a call invitation to a specified remote user (callee). This method has no asynchronous callbacks. To listen for {@link LocalInvitationState} changes, register the event handler in {@link LocalInvitationEvents} via the {@link on} method.
   */
  send(): void;

  /** @zh-cn
   * 取消已发送的呼叫邀请。该方法无异步回调。如需监听 {@link LocalInvitationState} 变化，请通过 {@link on} 方法注册 {@link LocalInvitationEvents} 中的事件回调。
   */
  /**
   * Allows the caller to cancel a sent call invitation. This method has no asynchronous callbacks. To listen for {@link LocalInvitationState} changes, register the event handler in {@link LocalInvitationEvents} via the {@link on} method.
   */
  cancel(): void;
  /** @zh-cn
   * 在该频道实例上添加 `listener` 函数到名为 `eventName` 的事件。其他 `RtmChannel` 实例上的事件方法请参考 [`EventEmitter` API 文档](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter)。
   * @param eventName 频道事件的名称。事件列表请参考 {@link RtmChannelEvents} 中的属性名。
   * @param listener 事件的回调函数。
   */
  /**
   * Adds the `listener` function to the channel for the event named `eventName`. See [the `EventEmitter` API documentation](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter) for other event methods on the `RtmChannel` instance.
   * @param eventName The name of the channel event. See the property names in the {@link RtmChannelEvents} for the list of events.
   * @param listener The callback function of the channel event.
   */
  on<EventName extends keyof RtmEvents.LocalInvitationEvents>(
    eventName: EventName,
    listener: (
      ...args: ListenerType<RtmEvents.LocalInvitationEvents[EventName]>
    ) => any
  ): this;
}

/** @zh-cn
 * 由 SDK 创建供被叫调用的呼叫邀请对象。
 * @noInheritDoc
 */
/**
 * The call invitation object created by the SDK and called by the callee.
 * @noInheritDoc
 */
declare class RemoteInvitation extends EventEmitter<
  RtmEvents.RemoteInvitationEvents
> {
  /** @zh-cn
   * 供被叫获取主叫的用户 ID。
   * @readonly
   */
  /**
   * Allows the callee to get the channel ID.
   * @readonly
   */
  readonly channelId: string;

  /** @zh-cn
   * 主叫的 uid。
   * @readonly
   */
  /**
   * uid of the caller.
   * @readonly
   */
  readonly callerId: string;

  /** @zh-cn
   * 主叫设置的呼叫邀请内容。
   * @readonly
   * @note 最大长度为 8 KB。
   */
  /**
   * The call invitation content set by the caller.
   * @readonly
   * @note The maximum length is 8 KB.
   */
  readonly content: string;

  /** @zh-cn
   * 呼叫邀请的状态。详见： {@link RemoteInvitationState} 。
   * @readonly
   */
  /**
   * States of the incoming call invitation. See: {@link RemoteInvitationState} .
   * @readonly
   */
  readonly state: RtmStatusCode.RemoteInvitationState;

  /** @zh-cn
   * 被叫设置的响应内容。
   * @note 最大长度为 8 KB。
   */
  /**
   * Response to the incoming call invitation.
   * @note The maximum length is 8 KB.
   */
  response: string;

  /** @zh-cn
   * 接受来自主叫的呼叫邀请。该方法无异步回调。如需监听 {@link RemoteInvitationState} 变化，请通过 {@link on} 方法注册 {@link RemoteInvitationEvents} 中的事件回调。
   */
  /**
   * Allows the callee to accept an incoming call invitation. This method has no asynchronous callbacks. To listen for {@link RemoteInvitationState} changes, register the event handler in {@link RemoteInvitationEvents} via the {@link on} method.
   */
  accept(): void;

  /** @zh-cn
   * 拒绝来自主叫的呼叫邀请。该方法无异步回调。如需监听 {@link RemoteInvitationState} 变化，请通过 {@link on} 方法注册 {@link RemoteInvitationEvents} 中的事件回调。
   */
  /**
   * Allows the callee to decline an incoming call invitation. This method has no asynchronous callbacks. To listen for {@link RemoteInvitationState} changes, register the event handler in {@link RemoteInvitationEvents} via the {@link on} method.
   */
  refuse(): void;

  /** @zh-cn
   * 在该频道实例上添加 `listener` 函数到名为 `eventName` 的事件。其他 `RtmChannel` 实例上的事件方法请参考 [`EventEmitter` API 文档](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter)。
   * @param eventName 频道事件的名称。事件列表请参考 {@link RtmChannelEvents} 中的属性名。
   * @param listener 事件的回调函数。
   */
  /**
   * Adds the `listener` function to the channel for the event named `eventName`. See [the `EventEmitter` API documentation](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter) for other event methods on the `RtmChannel` instance.
   * @param eventName The name of the channel event. See the property names in the {@link RtmChannelEvents} for the list of events.
   * @param listener The callback function of the channel event.
   */
  on<EventName extends keyof RtmEvents.RemoteInvitationEvents>(
    eventName: EventName,
    listener: (
      ...args: ListenerType<RtmEvents.RemoteInvitationEvents[EventName]>
    ) => any
  ): this;
}

/** @zh-cn
 * RTM 频道类。你可以调用 {@link createChannel} 方法创建 RTM 频道实例。
 * @noInheritDoc
 */
/**
 * Class to represent an RTM channel. You can call the {@link createChannel} method to create an RtmClient instance.
 * @noInheritDoc
 */
declare class RtmChannel extends EventEmitter<
  RtmEvents.RtmChannelEvents
> {
  /** @zh-cn
   * @readonly
   * 频道实例的 ID。
   */
  /**
   * @readonly
   * ID of the RTM channel instance.
   */
  readonly channelId: string;

  /** @zh-cn
   * 发送频道消息，所有加入频道的用户都会收到该频道消息。
   *
   * 发送消息（包括点对点消息和频道消息）的频率上限为 180 次每 3 秒。
   * @example **发送频道消息。**
   *
   * ```JavaScript
   * channel.sendMessage({ text: 'test channel message' }).then(() => {
   * // 你的代码：频道消息发送成功处理逻辑。
   * }).catch(error => {
   * // 你的代码：频道消息发送失败处理逻辑。
   * });
   * ```
  * @note 在实际开发中，你可以将已发送的频道消息作为应用界面上的用户已发送消息。这样可以在界面中显示用户频道消息的发送状态。发送频道消息的用户本身不会收到频道消息。
   * @param message 要发送的消息实例。
   * @return 该 Promise 会在发送频道消息成功后 resolve。
   */
  /**
   * Allows a user to send a message to all users in a channel.
   *
   * You can send messages, including peer-to-peer and channel messages at a maximum frequency of 180 calls every three seconds.
   * @example **Sending a channel message.**
   *
   * ```JavaScript
   * channel.sendMessage({ text: 'test channel message' }).then(() => {
   * // Your code for handling the event when the channel message is successfully sent.
   * }).catch(error => {
   * // Your code for handling the event when the channel message fails to be sent.
   * });
   * ```
   * @note In development, you can set the sent channel message as the sent message in the UI of your application. Thus, you can display the message status in the UI. The user who sends the channel message does not receive the same channel message.
   * @param message The message instance to be sent.
   * @return The Promise resolves after the user successfully sends a channel message.
   */
  sendMessage(
    message: RtmMessage,
  ): Promise<void>;

  /** @zh-cn
   * 调用该方法加入该频道，加入频道成功后可收到该频道消息和频道用户进退通知。
   *
   * 你最多可以加入 20 个频道。
   * @return 该 Promise 会在加入频道成功后 resolve。
   */
  /**
   * Joins a channel. After joining the channel, the user can receive channel messages and notifications of other users joining or leaving the channel.
   *
   * You can join a maximum of 20 channels.
   * @return The Promise resolves after the user successfully joins the channel.
   */
  join(): Promise<void>;

  /** @zh-cn
   * 调用该方法离开该频道，不再接收频道消息和频道用户进退通知。
   * @return 该 Promise 会在离开频道成功后 resolve。
   */
  /**
   * Leaves a channel. After leaving the channel, the user does not receive channel messages or notifications of users joining or leaving the channel.
   * @return The Promise resolves after the user successfully leaves the channel.
   */
  leave(): Promise<void>;

  /** @zh-cn
   * 获取频道用户列表
   * 
   * @return 该 Promise 会在成功获取频道用户列表后 resolve。Promise 返回的值为该频道所有用户 ID 的数组。
   */
  /**
   * Gets the member list of the channel.
   * 
   * @return The Promise resolves after the user gets the member list of the channel in an array with the channel's uids.
   */
  getMembers(): Promise<string[]>;

  /** @zh-cn
   * 在该频道实例上添加 `listener` 函数到名为 `eventName` 的事件。其他 `RtmChannel` 实例上的事件方法请参考 [`EventEmitter` API 文档](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter)。
   * 
   * @param eventName 频道事件的名称。事件列表请参考 {@link RtmChannelEvents} 中的属性名。
   * @param listener 事件的回调函数。
   */
  /**
   * Adds the `listener` function to the channel for the event named `eventName`. See [the `EventEmitter` API documentation](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter) for other event methods on the `RtmChannel` instance.
   * 
   * @param eventName The name of the channel event. See the property names in the {@link RtmChannelEvents} for the list of events.
   * @param listener The callback function of the channel event.
   */
  on<EventName extends keyof RtmEvents.RtmChannelEvents>(
    eventName: EventName,
    listener: (
      ...args: ListenerType<RtmEvents.RtmChannelEvents[EventName]>
    ) => any
  ): this;
}

/** @zh-cn
 * @hidden
 */
/**
 * @hidden
 */
type LogFilterType = {
  error: boolean;
  warn: boolean;
  info: boolean;
  track: boolean;
  debug: boolean;
};

/** @zh-cn
 * {@link RtmClient} 对象的配置参数。
 *
 * 可在初始化时通过 {@link createInstance} 的第 2 个参数或实例上的 {@link updateConfig} 方法进行设置。
 */
/**
 * Interface holding the configuration of an `RtmClient` instance.
 *
 * You can pass it as the second argument when calling the {@link createInstance} method, or use it when calling the {@link updateConfig} method.
 */
interface RtmConfig {
  /** @zh-cn
   * 是否上传日志。默认关闭。
   * - `true`: 启用日志上传；
   * - `false`: （默认）关闭日志上传。
   */
  /**
   * Whether to enable log upload. It is set to `false` by default.
   * - `true`: Enable log upload,
   * - `false`: (Default) Disable log upload.
   */
  enableLogUpload?: boolean;

  /** @zh-cn
   * 日志输出等级。
   *
   * 设置 SDK 的输出日志输出等级。不同的输出等级可以单独或组合使用。日志级别顺序依次为 OFF、ERROR、WARNING 和 INFO。选择一个级别，你就可以看到在该级别之前所有级别的日志信息。例如，你选择 WARNING 级别，就可以看到在 ERROR 和 WARNING 级别上的所有日志信息。
   *
   *  - {@link AgoraRTM.LOG_FILTER_OFF}
   *  - {@link AgoraRTM.LOG_FILTER_ERROR}
   *  - {@link AgoraRTM.LOG_FILTER_INFO} （默认）
   *  - {@link AgoraRTM.LOG_FILTER_WARNING}
   */
  /**
   * Output log level of the SDK.
   *
   * You can use one or a combination of the filters. The log level follows the sequence of OFF, ERROR, WARNING, and INFO. Choose a level to see the logs preceding that level. If, for example, you set the log level to WARNING, you see the logs within levels ERROR and WARNING.
   *
   *  - {@link AgoraRTM.LOG_FILTER_OFF}
   *  - {@link AgoraRTM.LOG_FILTER_ERROR}
   *  - {@link AgoraRTM.LOG_FILTER_INFO} (Default)
   *  - {@link AgoraRTM.LOG_FILTER_WARNING}
   */
  logFilter?: LogFilterType;

  /**
   * Whether to enable cloud proxy.
   */
  enableCloudProxy?: boolean;
}

/** @zh-cn
 * 表示用户 ID／在线状态键值对的接口。
 * <ul>
 * <li>`true`: 用户已登录到 Agora RTM 系统。</li>
 * <li>`false`: 用户已登出 Agora RTM 系统或因其他原因与 Agora RTM 系统断开连接。</li>
 * </ul>
 */
/**
 * Interface for the peerId / online status key-value pair.
 * <ul>
 * <li>`true`: The user has logged in the Agora RTM system.</li>
 * <li>`false`: The user has logged out of the Agora RTM system.</li>
 * </ul>
 */
interface PeersOnlineStatusResult {
  [peerId: string]: boolean;
}
/** @zh-cn
 * 表示频道名／频道人数键值对的接口。
 */
/**
 * Interface for the channelId / channel member count key-value pair.
 */
interface ChannelMemberCountResult {
  [channelId: string]: number;
}

/** @zh-cn
 * RTM 客户端类。你可以通过 {@link AgoraRTM} 上的 {@link createInstance} 方法创建 RTM 客户端实例。Agora RTM SDK 的入口。
 * @noInheritDoc
 */
/**
 * Class that represents the RTM client. You can call the {@link createInstance} method of {@link AgoraRTM} to create an `RtmClient` instance. This class is the entry point of the Agora RTM SDK.
 * @noInheritDoc
 */
declare class RtmClient extends EventEmitter<RtmEvents.RtmClientEvents> {
  /** @zh-cn
   * 用户登录 Agora RTM 系统。
   * @note 在 RTM 和 RTC 结合使用的场景下，Agora 推荐你错时进行登录 RTM 系统和加入 RTC 频道的操作。
   * @note 如果用户在不同的 RtmClient 实例中以相同用户 ID 登录，之前的登录将会失效，用户会被踢出之前加入的频道。
   * @param options.uid 登录 Agora RTM 系统的用户 ID。该字符串不可超过 64 字节。以下为支持的字符集范围:<ul>
   * <li>26 个小写英文字母 a-z</li>
   * <li>26 个大写英文字母 A-Z</li>
   * <li>10 个数字 0-9</li>
   * <li>空格</li>
   * <li>"!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ","</li>
   * </ul>
   * <p><b>Note</b></p><ul>
   * <li>请不要将 uid 设为空、null，或字符串 "null"。</li>
   * <li>uid 不支持 <code>number</code> 类型。建议调用 <code>toString()</code> 方法转化非 string 型 uid。</li>
   * </ul>
   * @param options.token 可选的动态密钥，一般由客户的服务端获取。
   * @return 该 Promise 会在登录成功后 resolve。
   */
  /**
   * Logs in to the Agora RTM system.
   *
   * @note If you use the Agora RTM SDK together with the Agora RTC SDK, Agora recommends that you avoid logging in to the RTM system and joining the RTC channel at the same time.
   * @note If the user logs in with the same uid from a different instance, the user will be kicked out of your previous login and removed from previously joined channels.
   * @param options.uid The uid of the user logging in the Agora RTM system. The string length must be less than 64 bytes with the following character scope:<ul>
   * <li>All lowercase English letters: a to z</li>
   * <li>All uppercase English letters: A to Z</li>
   * <li>All numeric characters: 0 to 9</li>
   * <li>The space character.</li>
   * <li>Punctuation characters and other symbols, including: "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ","</li>
   * </ul>
   * <p><b>Note</b></p><ul>
   * <li>The uid cannot be empty, or set as null or "null".</li>
   * <li>We do not support uids of the <code>number</code> type and recommend using the <code>toString()</code> method to convert your non-string uid.</li>
   * </ul>
   * @param options.token An optional token generated by the app server.
   * @return The Promise resolves after the user logs in to the Agora RTM system successfully.
   */
  login(options: { uid: string; token?: string }): Promise<void>;

  /** @zh-cn
   * 退出登录，退出后自动断开连接和销毁回调监听。
   * @return 该 Promise 会在登出成功并断开 WebSocket 连接后 resolve。
   */
  /**
   * Allows a user to log out of the Agora RTM system.
   *
   * After the user logs out of the Agora RTM system, the SDK disconnects from the Agora RTM system and destroys the corresponding event listener.
   * @return The Promises resolves after the user logs out of the Agora RTM system and disconnects from WebSocket.
   */
  logout(): Promise<void>;

  /** @zh-cn
   * 本地用户（发送者）向指定用户（接收者）发送点对点消息或点对点的离线消息。
   * <p>发送消息（包括点对点消息和频道消息）的频率上限为 180 次每 3 秒。</p>
   * @example
   * ```TypeScript
   * client.sendMessageToPeer(
   *   { text: 'test peer message' }, // 一个 RtmMessage 实例。
   *   'PeerId', // 对端用户的 uid。
   * ).then(sendResult => {
   *   if (sendResult.hasPeerReceived) {
   *     // 你的代码：远端用户收到消息事件。
   *   } else {
   *     // 你的代码：服务器已收到消息，对端未收到消息。
   *   }
   * }).catch(error => {
   *   // 你的代码：点对点消息发送失败。
   * });
   * ```
   * @param message 要发送的文字消息。
   * @param peerId 远端用户的 uid。
   * <p><b>Note</b></p>
   * uid 不支持 <code>number</code> 类型。建议调用 <code>toString()</code> 方法转化非 string 型 uid。
   * @return 该 Promise 会在发送成功后 resolve。Promise 的值代表对方是否在线并接收成功。
   */
  /**
   * Allows a user to send an (offline) peer-to-peer message to a specified remote user.
   * <p>You can send messages, including peer-to-peer and channel messages at a maximum frequency of 180 calls every three second.</p>
   * @example
   * ```TypeScript
   * client.sendMessageToPeer(
   *   { text: 'test peer message' }, // An RtmMessage object.
   *   'demoPeerId', // The uid of the remote user.
   * ).then(sendResult => {
   *   if (sendResult.hasPeerReceived) {
   *     // Your code for handling the event when the remote user receives the message.
   *   } else {
   *     // Your code for handling the event when the message is received by the server but the remote user cannot be reached.
   *   }
   * }).catch(error => {
   *   // Your code for handling the event when the message fails to be sent.
   * });
   * ```
   * @param message The message to be sent.
   * @param peerId  The uid of the peer user.
   * <p><b>Note</b></p>
   * We do not support uids of the <code>number</code> type. We recommend using the <code>toString()</code> method to convert a non-string uid.
   * @return The Promise resolves after the message is successfully sent. The value of the Promise indicates whether the peer user is online and receives the message.
   */
  sendMessageToPeer(
    message: RtmMessage,
    peerId: string,
  ): Promise<PeerMessageSendResult>;

  /** @zh-cn
   * 该方法创建一个 {@link RtmChannel} 实例。
   * @param channelId 频道名称。该字符串不可超过 64 字节。以下为支持的字符集范围:<ul>
   * <li>26 个小写英文字母 a-z</li>
   * <li>26 个大写英文字母 A-Z</li>
   * <li>10 个数字 0-9</li>
   * <li>空格</li>
   * <li>"!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ","</li>
   * </ul>
   * <p><b>Note:</b></p><ul>
   * <li>请不要将 channelId 设为空、null，或字符串 "null"。</li></ul>
   * @return 一个 {@link RtmChannel} 实例。
   */
  /**
   * Creates an {@link RtmChannel} instance.
   * @param channelId The unique channel name of the Agora RTM channel. The string length must be less than 64 bytes with the following character scope:<ul>
   * <li>All lowercase English letters: a to z</li>
   * <li>All uppercase English letters: A to Z</li>
   * <li>All numeric characters: 0 to 9</li>
   * <li>The space character.</li>
   * <li>Punctuation characters and other symbols, including: "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", " {", "}", "|", "~", ","</li>
   * </ul>
   * <p><b>Note:</b></p><ul>
   * <li>The channelId cannot be empty, null, or "null".</li></ul>
   * @return An {@link RtmChannel} instance.
   */
  createChannel(channelId: string): RtmChannel;
  /** @zh-cn
   * 该方法创建一个 {@link LocalInvitation} 实例。
   * @param calleeId 被叫的 uid。
   * @return 一个 {@link LocalInvitation} 实例。
   */
  /**
   * Creates a {@link LocalInvitation} instance.
   * @param calleeId The uid of the callee.
   * @return A {@link LocalInvitation} instance.
   */
  createLocalInvitation(calleeId: string): LocalInvitation;

  /** @zh-cn
   * 全量设置本地用户的属性。
   *
   * @param attributes 新的属性。
   * @return 该 Promise 会在设置本地用户属性成功后 resolve。
   */
  /**
   * Substitutes the local user's attributes with new ones.
   *
   * @param attributes The new attributes.
   * @return The Promise resolves after successfully setting the local user's attributes.
   */
  setLocalUserAttributes(attributes: AttributesMap): Promise<void>;

  /** @zh-cn
   * 添加或更新本地用户的属性。
   * <ul>
   * <li>如果属性已存在，该方法更新本地用户的已有属性；</li>
   * <li>如果属性不存在，该方法增加本地用户的属性。</li>
   * </ul>
   *
   * @param attributes 待增加或更新的属性列表。
   * @return 该 Promise 会在添加或更新本地用户属性成功后 resolve。
   */
  /**
   * Adds or updates the local user's attributes.
   *
   * <p>This method updates the local user's attributes if it finds that the attributes has/have the same keys, or adds attributes to the local user if it does not.
   *
   * @param attributes The attributes to be added or updated.
   * @return The Promise resolves after successfully adding or updating the local user's attributes.
   */
  addOrUpdateLocalUserAttributes(attributes: AttributesMap): Promise<void>;

  /** @zh-cn
   * 删除本地用户的指定属性。
   *
   * @param attributeKeys 属性名列表。
   * @return 该 Promise 会在删除指定属性成功后 resolve。
   */
  /**
   * Deletes the local user's attributes using attribute keys.
   *
   * @param attributeKeys A list of the attribute keys to be deleted.
   * @return The Promise resolves after successfully deleting the local user's attributes.
   */
  deleteLocalUserAttributesByKeys(attributeKeys: string[]): Promise<void>;

  /** @zh-cn
   * 清空本地用户的所有属性。
   * @return 该 Promise 会在清空本地用户属性成功后 resolve。
   */
  /**
   * Clears all attributes of the local user.
   * @return The Promise resolves after successfully clearing the local user's attributes.
   */
  clearLocalUserAttributes(): Promise<void>;

  /** @zh-cn
   * 获取指定用户的全部属性。
   *
   * @param userId 指定用户的用户 ID。
   */
  /**
   * Gets all attributes of a specified user.
   *
   * @param userId The user ID of the specified user.
   */
  getUserAttributes(userId: string): Promise<AttributesMap>;

  /** @zh-cn
   * 获取指定用户指定属性名的属性。
   *
   * @param userId 指定用户的用户 ID。
   * @param attributeKeys 属性名列表。
   */
  /**
   * Gets the attributes of a specified user by attribute keys.
   *
   * @param userId The user ID of the specified user.
   * @param attributeKeys An array of the attribute keys.
   */
  getUserAttributesByKeys(
    userId: string,
    attributeKeys: string[]
  ): Promise<AttributesMap>;

  /** @zh-cn
   * 查询指定用户的在线状态。
   *
   * @param peerIds 用户 ID 列表。用户 ID 的数量不能超过 256。
   */
  /**
   * Queries the online status of the specified users.
   *
   * @param peerIds A list of the user IDs. The number of user IDs must not exceed 256.
   */
  queryPeersOnlineStatus(peerIds: string[]): Promise<PeersOnlineStatusResult>;

  /** @zh-cn
   * 更新当前 Token。
   *
   * @param token 新的 Token。
   */
  /**
   * Renews the token.
   *
   * @param token Your new Token.
   */
  renewToken(token: string): Promise<void>;

  /** @zh-cn
   * 修改 `RtmClient` 实例配置。修改实时生效。
   *
   * @param config 设置 SDK 是否上传日志以及日志的输出等级。详见 {@link RtmConfig}。
   */
  /**
   * Modifies the `RtmClient` instance configuration. The changes take effect immediately.
   *
   * @param config Sets whether the SDK uploads logs, and sets the output level of logs. See {@link RtmConfig}.
   */
  updateConfig(config: RtmConfig): void;

  /** @zh-cn
   *
   * 修改 `RtmClient` 实例配置。修改实时生效。
   *
   * @deprecated 该方法自 v1.4.2 起已废弃，请使用 {@link updateConfig}。
   *
   *
   * @param config 设置 SDK 是否上传日志以及日志的输出等级。详见 {@link RtmConfig}。
   */
  /**
   * Modifies the `RtmClient` instance configuration. The changes take effect immediately.
   * 
   * @deprecated This method is deprecated as of v1.4.2. Please use {@link updateConfig} instead.
   *
   * @param config Sets whether the SDK uploads logs, and sets the output level of logs. See {@link RtmConfig}.
   */
  setParameters(config: RtmConfig): void;

  /** @zh-cn
   * 查询单个或多个频道的成员人数。
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> 该方法的调用频率上限为每秒 1 次。</li>
   * <li> 不支持一次查询超过 32 个频道的成员人数。</li>
   * </ul>
   * @param channelIds 指定频道名列表。
   */
  /**
   * Gets the member count of specified channels.
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> The call frequency limit for this method is one call per second.</li>
   * <li> We do not support getting the member counts of more than 32 channels in one method call.</li>
   * </ul>
   * @param channelIds An array of the specified channel IDs.
   */
  getChannelMemberCount(
    channelIds: string[]
  ): Promise<ChannelMemberCountResult>;

  /** @zh-cn
   * 查询某指定频道的全部属性。
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> 你无需加入指定频道即可查询该频道的属性。</li>
   * <li> {@link getChannelAttributes} 和 {@link getChannelAttributesByKeys} 一并计算在内：调用频率限制为每 5 秒 10 次。</li>
   * </ul>
   * @param channelId 该指定频道的 ID。
   */
  /**
   * Gets all attributes of a specified channel.
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> You do not have to join the specified channel to delete its attributes.</li>
   * <li> For {@link getChannelAttributes} and {@link getChannelAttributesByKeys} taken together: the call frequency limit is 10 calls every five seconds.</li>
   * </ul>
   * @param channelId The ID of the specified channel.
   */
  getChannelAttributes(channelId: string): Promise<ChannelAttributes>;

  /** @zh-cn
   * 查询某指定频道指定属性名的属性。
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> 你无需加入指定频道即可查询该频道的属性。</li>
   * <li> {@link getChannelAttributes} 和 {@link getChannelAttributesByKeys} 一并计算在内：调用频率限制为每 5 秒 10 次。</li>
   * </ul>
   * @param channelId 该指定频道的频道 ID。
   * @param keys 频道属性名列表。
   */
  /**
   * Gets the attributes of a specified channel by attribute keys.
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> You do not have to join the specified channel to get its attributes.</li>
   * <li> For {@link getChannelAttributes} and {@link getChannelAttributesByKeys} taken together: the call frequency limit is 10 calls every five seconds.</li>
   * </ul>
   * @param channelId The ID of the specified channel.
   * @param keys An array of attribute keys.
   */
  getChannelAttributesByKeys(
    channelId: string,
    keys: string[]
  ): Promise<ChannelAttributes>;

  /** @zh-cn
   * 清空某指定频道的属性。
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> 你无需加入指定频道即可清空该频道的属性。</li>
   * <li> [RtmClient.setChannelAttributes()]{@link setLocalUserAttributes}、 {@link addOrUpdateChannelAttributes}、 {@link deleteChannelAttributesByKeys} 和 {@link clearChannelAttributes} 一并计算在内：调用频率限制为每 5 秒 10 次。</li>
   * </ul>
   * @param channelId 该指定频道的频道 ID。
   * @param options 频道属性操作选项。详见 {@link ChannelAttributeOptions}。
   */
  /**
   * Clears all attributes of a specified channel.
   *
   * <p><b>Note</b></p>
   *
   * - You do not have to join the specified channel to clear its attributes.
   * - For {@link RtmClient.setChannelAttributes}, {@link addOrUpdateChannelAttributes}, {@link deleteChannelAttributesByKeys}, and {@link clearChannelAttributes} taken together: the call frequency limit is 10 calls every five seconds.
   * @param channelId The channel ID of the specified channel.
   * @param options Options for this attribute operation. See {@link ChannelAttributeOptions}.
   */
  clearChannelAttributes(
    channelId: string,
    options?: ChannelAttributeOptions
  ): Promise<void>;

  /** @zh-cn
   * 删除某指定频道的指定属性。
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> 你无需加入指定频道即可删除该频道的属性。</li>
   * <li> 当某频道处于空频道状态（无人状态）数分钟后，该频道的频道属性将被清空。</li>
   * <li> {@link setLocalUserAttributes}、 {@link addOrUpdateChannelAttributes}、 {@link deleteChannelAttributesByKeys} 和 {@link clearChannelAttributes} 一并计算在内：调用频率限制为每 5 秒 10 次。</li>
   * </ul>
   * @param channelId 该指定频道的 ID。
   * @param attributeKeys 属性名列表。
   * @param options 频道属性操作选项。详见 {@link ChannelAttributeOptions}。
   */
  /**
   * Deletes the local user's attributes using attribute keys.
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> You do not have to join the specified channel to delete its attributes.</li>
   * <li> The attributes of a channel will be cleared if the channel remains empty (has no members) for a couple of minutes.</li>
   * <li> For {@link setLocalUserAttributes}, {@link addOrUpdateChannelAttributes}, {@link deleteChannelAttributesByKeys}, and {@link clearChannelAttributes} taken together: the call frequency limit is 10 calls every five seconds.</li>
   * </ul>
   * @param channelId The channel ID of the specified channel.
   * @param attributeKeys A list of channel attribute keys.
   * @param options Options for this attribute operation. See {@link ChannelAttributeOptions}.
   */
  deleteChannelAttributesByKeys(
    channelId: string,
    attributeKeys: string[],
    options?: ChannelAttributeOptions
  ): Promise<void>;

  /** @zh-cn
   * 添加或更新某指定频道的属性。
   * <ul>
   * <li>如果属性已存在，该方法更新该频道的已有属性；</li>
   * <li>如果属性不存在，该方法增加该频道的属性。</li>
   * </ul>
   * <p><b>Note</b></p>
   * <ul>
   * <li> 你无需加入指定频道即可为该频道更新频道属性。</li>
   * <li> 当某频道处于空频道状态（无人状态）数分钟后，该频道的频道属性将被清空。</li>
   * <li> {@link setLocalUserAttributes}、 {@link addOrUpdateChannelAttributes}、 {@link deleteChannelAttributesByKeys} ，和 {@link clearChannelAttributes} 一并计算在内：调用频率限制为每 5 秒 10 次。</li>
   * </ul>
   * @param channelId 该指定频道的 ID。
   * @param attributes 待增加或更新的属性列表。
   * @param options 频道属性操作选项。详见 {@link ChannelAttributeOptions}。
   */
  /**
   * Adds or updates the attributes of a specified channel.
   *
   * This method updates the specified channel's attributes if it finds that the attributes has/have the same keys, or adds attributes to the channel if it does not.
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> You do not have to join the specified channel to update its attributes.</li>
   * <li> The attributes of a channel will be cleared if the channel remains empty (has no members) for a couple of minutes.</li>
   * <li> For {@link setLocalUserAttributes}, {@link addOrUpdateChannelAttributes}, {@link deleteChannelAttributesByKeys}, and {@link clearChannelAttributes} taken together: the call frequency limit is 10 calls every five seconds.</li>
   * </ul>
   * @param channelId The channel ID of the specified channel.
   * @param attributes An array of channel attributes.
   * @param options Options for this attribute operation. See {@link ChannelAttributeOptions}.
   */
  addOrUpdateChannelAttributes(
    channelId: string,
    attributes: AttributesMap,
    options?: ChannelAttributeOptions
  ): Promise<void>;

  /** @zh-cn
   * 全量设置某指定频道的属性。
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li>你无需加入指定频道即可为该频道设置频道属性。</li>
   * <li>当某频道处于空频道状态（无人状态）数分钟后，该频道的频道属性将被清空。</li>
   * <li>{@link setLocalUserAttributes}、 {@link addOrUpdateChannelAttributes}、 {@link deleteChannelAttributesByKeys} ，和 {@link clearChannelAttributes} 一并计算在内：调用频率限制为每 5 秒 10 次。</li>
   * </ul>
   * @param channelId 该指定频道的频道 ID。
   * @param attributes 频道属性列表实例。
   * @param options 频道属性操作选项。详见 {@link ChannelAttributeOptions}。
   */
  /**
   * Sets the attributes of a specified channel with new ones.
   *
   * <p><b>Note</b></p>
   * <ul>
   * <li> You do not have to join the specified channel to reset its attributes.</li>
   * <li> The attributes of a channel will be cleared if the channel remains empty (has no members) for a couple of minutes.</li>
   * <li> For {@link setLocalUserAttributes}, {@link addOrUpdateChannelAttributes}, {@link deleteChannelAttributesByKeys}, and {@link clearChannelAttributes} taken together: the call frequency limit is 10 calls every five seconds.</li>
   * </ul>
   * @param channelId The channel ID of the specified channel.
   * @param attributes An array of channel attributes.
   * @param options Options for this attribute operation. See {@link ChannelAttributeOptions}.
   */
  setChannelAttributes(
    channelId: string,
    attributes: AttributesMap,
    options?: ChannelAttributeOptions
  ): Promise<void>;

  /** @zh-cn
   * 订阅指定单个或多个用户的在线状态。
   * <ul>
   * <li>首次订阅成功后，SDK 会通过 {@link RtmClientEvents.PeersOnlineStatusChanged} 回调返回被订阅用户在线状态。</li>
   * <li>每当被订阅用户在线状态发生变化时，SDK 都会通过 {@link RtmClientEvents.PeersOnlineStatusChanged} 回调通知订阅方。</li>
   * <li>如果 SDK 在断线重连过程中有被订阅用户的在线状态发生改变，SDK 会在重连成功时通过 {@link RtmClientEvents.PeersOnlineStatusChanged} 回调通知订阅方。</li>
   * </ul>
   * <p><b>Note</b></p>
   * <ul>
   * <li>用户登出 Agora RTM 系统后，所有之前的订阅内容都会被清空；重新登录后，如需保留之前订阅内容则需重新订阅。</li>
   * <li>SDK 会在网络连接中断时进入断线重连状态。重连成功时 SDK 会自动重新订阅之前订阅用户，无需人为干预。</li>
   * </ul>
   * @param peerIds
   */
  /**
   * Subscribes to the online status of the specified users.
   * <ul>
   * <li>When the method call succeeds, the SDK returns the {@link RtmClientEvents.PeersOnlineStatusChanged} callback to report the online status of peers, to whom you subscribe.</li>
   * <li>When the online status of the peers, to whom you subscribe, changes, the SDK returns the {@link RtmClientEvents.PeersOnlineStatusChanged} callback to report whose online status has changed.</li>
   * <li>If the online status of the peers, to whom you subscribe, changes when the SDK is reconnecting to the server, the SDK returns the {@link RtmClientEvents.PeersOnlineStatusChanged} callback to report whose online status has changed when successfully reconnecting to the server.</li>
   * </ul>
   * <p><b>Note</b></p>
   * <ul>
   * <li>When you log out of the Agora RTM system, all the status that you subscribe to will be cleared. To keep the original subscription after you re-log in the system, you need to redo the whole subscription process.</li>
   * <li>When the SDK reconnects to the server from the state of being interrupted, the SDK automatically subscribes to the peers and states before the interruption without human intervention.</li>
   * </ul>
   * @param peerIds An array of the specified user IDs.
   */
  subscribePeersOnlineStatus(peerIds: string[]): Promise<void>;

  /** @zh-cn
   * 退订指定单个或多个用户的在线状态。
   *
   * @param peerIds 被退订用户的用户 ID 阵列。
   */
  /**
   * Unsubscribes from the online status of the specified users.
   *
   * @param peerIds An array of the specified user IDs.
   */
  unsubscribePeersOnlineStatus(peerIds: string[]): Promise<void>;

  /** @zh-cn
   * 获取某特定内容被订阅的用户列表。
   *
   * @param option 被订阅的类型。详见 {@link RtmStatusCode.PeerSubscriptionOption}。
   */
  /**
   * Gets a list of the peers, to whose specific status you have subscribed.
   *
   * @param option The status type, to which you have subscribed. See {@link RtmStatusCode.PeerSubscriptionOption}.
   */
  queryPeersBySubscriptionOption(
    option: RtmStatusCode.PeerSubscriptionOption
  ): Promise<string[]>;



  /** @zh-cn
   * 创建一个消息实例，可用于发送点对点消息或频道消息。
   *
   * @typeParam T {@link RtmMessage} 类型别名。
   *
   * @param message 一个包含 {@link RtmMessage} 中任意属性的对象。
   *
   * @return 一个 {@link RtmMessage} 实例。你可以用这个实例发送点对点消息或频道消息。
   *
   */
  /**
   *
   * @typeParam T A {@link RtmMessage} type.
   *
   * @param message An object that includes any property of {@link RtmMessage}.
   *
   * @return A message instance to send. You can use the message instance to send peer-to-peer or channel messages.
   *
   */
  createMessage<T extends RtmMessage>(message: Partial<T>): T;

  /** @zh-cn
   * 在该频道实例上添加 `listener` 函数到名为 `eventName` 的事件。其他 `RtmClient` 实例上的事件方法请参考 [`EventEmitter` API 文档](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter)。
   * @param eventName RTM 客户端事件的名称。事件列表请参考 {@link RtmClientEvents} 中的属性名。
   * @param listener 事件的回调函数。
   */
  /**
   * Adds the `listener` function to the channel for the event named `eventName`. See [the `EventEmitter` API documentation](https://nodejs.org/docs/latest/api/events.html#events_class_eventemitter) for other event methods on the `RtmClient` instance.
   * @param eventName The name of the RTM client event. See the property names in the {@link RtmClientEvents} for the list of events.
   * @param listener The callback function of the RTM client event.
   */
  on<EventName extends keyof RtmEvents.RtmClientEvents>(
    eventName: EventName,
    listener: (
      ...args: ListenerType<RtmEvents.RtmClientEvents[EventName]>
    ) => any
  ): this;
}

/** @zh-cn
 * AgoraRTM 是 Agora RTM SDK 的导出模块。
 *
 * 使用 `<script>` 标签引入 SDK 时，产生名为 `AgoraRTM` 的全局变量，该变量含有该模块的所有成员。
 *
 * @example 直接在 HTML 中引入 `<script src="agora-rtm-sdk-0.9.1.js"></script>`。
 *
 * **Note:**
 *
 * 此处文件名 `agora-rtm-sdk-0.9.1.js` 中的版本号 `0.9.1` 仅供参考，安装时请使用最新版的 SDK 和链接地址。
 */
/**
 * AgoraRTM is the exported module of the Agora RTM SDK.
 *
 * If you import the Agora RTM Web SDK using the `<script>` tag, the SDK creates a global variable called `AgoraRTM`, which includes all the module members.
 *
 * @example Direct include `<script src="agora-rtm-sdk-0.9.1.js"></script>` in your HTML.
 * <p><b>Note:</b></p>
 * <p>The version `0.9.1` in the file name `agora-rtm-sdk-0.9.1.js` is for reference only, please use the latest version of the SDK.
 */
declare namespace AgoraRTM {
  /** @zh-cn
   * 不输出日志信息。
   */
  /**
   * Do not output any log information.
   */
  const LOG_FILTER_OFF: LogFilterType;
  /** @zh-cn
   * 输出 ERROR 级别的日志信息。
   */
  /**
   * Output ERROR level log information.
   */
  const LOG_FILTER_ERROR: LogFilterType;
  /** @zh-cn
   * 输出 ERROR、WARNING 和 INFO 级别的日志信息。 我们推荐你将日志级别设为该等级。
   */
  /**
   * Output ERROR, WARNING, and INFO level log information.
   */
  const LOG_FILTER_INFO: LogFilterType;
  /** @zh-cn
   * 输出 ERROR 和 WARNING 级别的日志信息。
   */
  /**
   * Output WARNING and INFO level log information.
   */
  const LOG_FILTER_WARNING: LogFilterType;
  // const LOG_FILTER_DEBUG: LogFilterType;

  /** @zh-cn
   * Agora RTM SDK 的版本号。
   */
  /**
   * Version of the Agora RTM SDK.
   * @example `AgoraRTM.VERSION`
   */
  const VERSION: string;

  /** @zh-cn
   * Agora RTM SDK 的编译信息。
   */
  /**
   * Compilation information of the Agora RTM SDK.
   * @example `AgoraRTM.BUILD`
   */
  const BUILD: string;

  const END_CALL_PREFIX: string;

  /** @zh-cn
   * 该方法创建并返回一个 {@link RtmClient} 实例。
   * <p> Agora RTM SDK 支持多个 {@link RtmClient} 实例。</p>
   * <p> {@link RtmClient} 类的所有接口函数都是异步调用。</p>
   * @example **创建 RtmClient 对象**
   *
   * ```JavaScript
   * import AgoraRTM from 'agora-rtm-sdk';
   * const client = AgoraRTM.createInstance('demoAppId', { enableLogUpload: false }); // Pass your App ID here.
   * ```
   * @param appId 传入项目的 App ID。必须是 ASCII 编码，长度为 32 个字符。
   * @param config {@link RtmClient} 对象的配置参数。详见 {@link RtmConfig}。
   * @return 一个 {@link RtmClient} 实例。
   */
  /**
   * Creates and returns an {@link RtmClient} instance.
   * <p>The Agora RTM SDK supports creating multiple {@link RtmClient} instances.</p>
   * <p>All methods in the {@link RtmClient} class are executed asynchronously.</p>
   * @example **Create an RtmClient instance**
   *
   * ```JavaScript
   * import AgoraRTM from 'agora-rtm-sdk';
   * const client = AgoraRTM.createInstance('demoAppId', { enableLogUpload: false }); // Pass your App ID here.
   * ```
   * @param appId App ID of your project that must be a string containing 32 ASCII characters.
   * @param config The configuration of an {@link RtmClient} instance. See {@link RtmConfig}.
   * @return An {@link RtmClient} instance.
   */
  function createInstance(appId: string, config?: RtmConfig): RtmClient;

  /** @zh-cn
   * @deprecated 从 v1.4.3 起废弃，声网不建议你使用。请改用 {@link createInstance} 方法。
   * 该方法创建并返回一个 {@link RtmClient} 实例。
   * <p> Agora RTM SDK 支持多个 {@link RtmClient} 实例。</p>
   * <p> {@link RtmClient} 类的所有接口函数都是异步调用。</p>
   * @example **创建 RtmClient 对象**
   *
   * ```JavaScript
   * import AgoraRTM from 'agora-rtm-sdk';
   * const client = AgoraRTM.createInstance('demoAppId', { enableLogUpload: false }); // Pass your App ID here.
   * ```
   * @param appId 传入项目的 App ID。必须是 ASCII 编码，长度为 32 个字符。
   * @param config {@link RtmClient} 对象的配置参数。详见 {@link RtmConfig}。
   * @param areaCodes Agora RTM 服务的限定区域。详见 {@link AreaCode}。
   * @return 一个 {@link RtmClient} 实例。
   */
  /**
   * @deprecated From v2.3.2. Use {@link createInstance} instead.
   *
   * Creates and returns an {@link RtmClient} instance.
   * <p>The Agora RTM SDK supports creating multiple {@link RtmClient} instances.</p>
   * <p>All methods in the {@link RtmClient} class are executed asynchronously.</p>
   * @example **Create an RtmClient instance**
   *
   * ```JavaScript
   * import AgoraRTM from 'agora-rtm-sdk';
   * const client = AgoraRTM.createInstance('demoAppId', { enableLogUpload: false }); // Pass your App ID here.
   * ```
   * @param appId App ID of your project that must be a string containing 32 ASCII characters.
   * @param config The configuration of an {@link RtmClient} instance. See {@link RtmConfig}.
   * @param areaCodes Region for the Agora RTM service. See {@link AreaCode}.
   * @return An {@link RtmClient} instance.
   */
   function createInstance(
    appId: string,
    config?: RtmConfig,
    areaCodes?: RtmStatusCode.AreaCode[]
  ): RtmClient;

  /** @zh-cn
   * @since 1.4.3
   *
   * 设置 Agora RTM SDK 的访问区域。支持设置多个访问区域。
   *
   * 注意：
   * - 该功能为高级设置，适用于有访问安全限制的场景。
   * - 默认情况下，SDK 会就近选择 Agora 服务器进行连接。设置访问区域之后，SDK 只会连接到指定区域内的 Agora 服务器。
   * - 该方法支持去除访问区域中的个别区域。
   * @param areaConfig 访问区域设置。
   * - areaCodes 访问区域，详见 {@link AreaCode}。
   * - excludedArea 排除区域，支持设置为`CHINA`，`JAPAN` 和 `ASIA`。该参数仅对于 `GLOBAL` 的访问区域有效。
   * @param areaCodes 访问区域，详见 {@link AreaCode}。
   * @param excludedArea 排除区域，支持设置为`CHINA`，`JAPAN` 和 `ASIA`。该参数仅对于 `GLOBAL` 的访问区域有效。
   */
  /**
   * @since 1.4.3
   *
   * Sets the regions for connection.
   *
   * **Note:**
   * - This advanced feature applies to scenarios that have regional restrictions.
   * - By default, the SDK connects to nearby Agora servers. After specifying the regions, the SDK connects to the Agora servers within those regions.
   * - You can remove some areas from the region for connection.
   * @param areaConfig The configration of regions for connection.
   * - areaCodes: The region for connection. For details, see {@link AreaCode}.
   * - excludedArea: Exclude areas, which can be set to `CHINA`, `JAPAN` and `ASIA`. This parameter is only valid when the region for connection is `GLOBAL`.
   */
  function setArea(areaConfig: {
    areaCodes: RtmStatusCode.AreaCode[];
    excludedArea?: RtmStatusCode.AreaCode;
  }): void;

  /**@zh-cn
   * 连接状态改变原因。
   */
  /**
   * The reason of the connection state change.
   */
  const ConnectionChangeReason: typeof RtmStatusCode.ConnectionChangeReason;
  /**@zh-cn
   * 连接状态。
   */
  /**
   * The connection state.
   */
  const ConnectionState: typeof RtmStatusCode.ConnectionState;
  /**@zh-cn
   * （返回给主叫）呼叫邀请失败原因。
   */
  /**
   * (Return to the caller) The reason of the local invitation failure.
   */
  const LocalInvitationFailureReason: typeof RtmStatusCode.LocalInvitationFailureReason;
  /**@zh-cn
   * 返回给主叫的呼叫邀请状态。
   */
  /**
   * Call invitation state returned to the caller.
   */
  const LocalInvitationState: typeof RtmStatusCode.LocalInvitationState;
  /**@zh-cn
   * 返回给被叫的呼叫邀请状态。
   */
  /**
   * Call invitation state returned to the callee.
   */
  const RemoteInvitationState: typeof RtmStatusCode.RemoteInvitationState;
  /**@zh-cn
   * （返回给被叫）呼叫邀请失败原因。
   */
  /**
   * (Return to the callee) The reason of the local invitation failure.
   */
  const RemoteInvitationFailureReason: typeof RtmStatusCode.RemoteInvitationFailureReason;
  /**@zh-cn
   * 消息类型。
   */
  /**
   * Message type.
   */
  const MessageType: typeof RtmStatusCode.MessageType;
  /**@zh-cn
   * 用户的在线状态。
   */
  /**
   * Online state of the user.
   */
  const PeerOnlineState: typeof RtmStatusCode.PeerOnlineState;
  /**@zh-cn
   * 订阅类型。
   */
  /**
   * Subscription type.
   */
  const PeerSubscriptionOption: typeof RtmStatusCode.PeerSubscriptionOption;
  /**@zh-cn
   * Agora RTM 服务的限定区域。默认为 AgoraAreaGLOB，即限定区域为全球。详见 {@link AreaCode}。
   */
  /**
   * Region for the Agora RTM service. The default is `GLOBAL`. See {@link AreaCode}.
   */
  const AreaCode: typeof RtmStatusCode.AreaCode;
}

export default AgoraRTM;
export type { LocalInvitation, RemoteInvitation, RtmChannel, RtmClient, RtmEvents, RtmMessage, RtmRawMessage, RtmStatusCode, RtmTextMessage };
