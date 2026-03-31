export interface Application {
  id: string;
  discordName: string;
  discordId: string;
  category: string;
  content: string;
  status: string;
  timestamp: string;
}

export interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  channels: {
    id: string;
    name: string;
    type: number;
    position?: number;
  }[];
}

export interface BotStatus {
  online: boolean;
  uptime: number;
  version: string;
  serverCount: number;
  status: string;
  startTime: number;
}
