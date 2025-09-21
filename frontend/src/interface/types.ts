export interface TotalCountType {
    users: number;
    commands: number;
    plugins: number;
}

export interface ToastType {
    status: "info" | "success" | "error";
    message: string;
}

export interface UserType {
    id: number;
    username: string;
    level: number;
}

export interface PluginType {
    id: number;
    name: string;
    enabled: boolean;
    description: string;
    version: string;
    author: string;
    license: string;
    download_link: string;
    poster?: string;
    price?: number;
}

export interface CommandType {
    id: number;
    name: string;
    response_text: string;
    enabled: boolean;
    created_at: Date;
    description: string;
}

export interface NewCommandType {
    name: string;
    response_text: string;
    description: string;
}

export interface TelegramUserType {
    id: number;
    user_id: number;
    chat_id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
    is_bot: boolean;
    subscribed: boolean;
    last_seen: Date;
    created_at: Date;
    updated_at: Date;
}

export interface MainDataType {
    total_count: TotalCountType;
    plugins: PluginType[];
    commands: CommandType[];
    users: TelegramUserType[];
    bot: Bot;
}

export interface Bot {
    id: number;
    name: string;
    token: string;
    config: SettingsState;
    plugins: BotPlugin[];
}

export interface BotPlugin {
    bot_id: number;
    plugin_id: number;
    enabled: boolean;
    config: any;
    plugin: PluginType;
}

export interface SettingsState {
  webhookUrl: string;
  timezone: string;
  language: string;
  commandPrefix: string;
  enableWebhooks: boolean;
  enableNotifications: boolean;
  maxMessageLength: number;
  notifyChatIds?: number[];
};

export interface BotSetting {
  id: number;
  name: string;
  token: string;
  config: SettingsState;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  password?: string;
}

export interface BotLightSetting {
    id: number;
    name: string;
    token: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface NewBotSetting {
    name: string;
    token?: string;
    config?: SettingsState;
    password?: string;
}

export interface MediaType {
    id: number;
    file_size: number;
    file_name: string;
    file_path: string;
    created_at: Date;
    updated_at: Date;
}