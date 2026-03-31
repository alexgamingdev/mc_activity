import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  Server,
  FileText,
  Clock,
  Volume2,
  Loader2,
  Hash,
  SmilePlus,
  MessageSquare,
  Music,
  Link,
  Upload,
  StopCircle,
  ImageIcon,
  Pencil,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, setStoredApiKey, clearStoredApiKey } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BotStatus } from "@/types/schema";

interface ServerAppearanceEntry {
  nickname: string | null;
  avatarUrl: string | null;
}

interface BotInfo {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  serverAppearance: Record<string, ServerAppearanceEntry>;
}

interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  channels: { id: string; name: string; type: number }[];
}

function ApiKeySection() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [storedKey, setStoredKey] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("discord-bot-api-key");
  });

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast({ title: "Error", description: "API key cannot be empty", variant: "destructive" });
      return;
    }
    setStoredApiKey(apiKey.trim());
    setStoredKey(apiKey.trim());
    setApiKey("");
    toast({ title: "Success", description: "API key saved to browser storage" });
  };

  const handleCopyKey = async () => {
    if (!storedKey) return;
    await navigator.clipboard.writeText(storedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "API key copied to clipboard" });
  };

  const handleClearKey = () => {
    clearStoredApiKey();
    setStoredKey(null);
    toast({ title: "Cleared", description: "API key removed from browser" });
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Hash className="w-4 h-4" />
          Server Dashboard Access
        </CardTitle>
        <CardDescription className="text-blue-700">
          Use your server API key to access this dashboard. Get it with <code>/key get</code> in Discord.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {storedKey ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
              <code className="flex-1 text-xs font-mono text-blue-600 break-all">{storedKey}</code>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={handleCopyKey}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button size="sm" variant="destructive" onClick={handleClearKey}>
                  Clear
                </Button>
              </div>
            </div>
            <p className="text-xs text-green-700">Authenticated for one server.</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Paste your API key (starts with sk_)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
              type="password"
            />
            <Button onClick={handleSaveKey} disabled={!apiKey.trim()}>
              Save Key
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServerAppearanceCard({
  server,
  appearance,
}: {
  server: DiscordServer;
  appearance: ServerAppearanceEntry | undefined;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nickname, setNickname] = useState(appearance?.nickname ?? "");
  const [avatarUrl, setAvatarUrl] = useState("");

  const serverIconUrl = server.icon
    ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=64`
    : null;

  const currentBotAvatar = appearance?.avatarUrl ?? null;

  const nicknameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/discord/servers/${server.id}/nickname`, { nickname });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Nickname updated", description: `Nickname saved for ${server.name}.` });
      qc.invalidateQueries({ queryKey: ["/api/discord/bot/info"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/discord/servers/${server.id}/avatar`, { imageUrl: avatarUrl });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Avatar updated", description: `Per-server avatar set for ${server.name}.` });
      setAvatarUrl("");
      qc.invalidateQueries({ queryKey: ["/api/discord/bot/info"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={serverIconUrl ?? undefined} />
          <AvatarFallback className="text-xs">{server.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="text-sm truncate">{server.name}</CardTitle>
          <CardDescription className="text-xs">ID: {server.id}</CardDescription>
        </div>
        {currentBotAvatar && (
          <Avatar className="w-8 h-8 shrink-0 ml-auto">
            <AvatarImage src={currentBotAvatar} />
            <AvatarFallback className="text-xs">Bot</AvatarFallback>
          </Avatar>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            Server Avatar (per-server)
          </Label>
          <div className="flex gap-2">
            <Input
              data-testid={`input-server-avatar-${server.id}`}
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="flex-1 text-xs"
            />
            <Button
              data-testid={`button-set-server-avatar-${server.id}`}
              size="icon"
              onClick={() => avatarMutation.mutate()}
              disabled={avatarMutation.isPending || !avatarUrl}
            >
              {avatarMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Pencil className="w-3 h-3" />
            Nickname (leave empty to reset)
          </Label>
          <div className="flex gap-2">
            <Input
              data-testid={`input-nickname-${server.id}`}
              placeholder="Custom nickname…"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="flex-1 text-xs"
            />
            <Button
              data-testid={`button-save-nickname-${server.id}`}
              size="icon"
              onClick={() => nicknameMutation.mutate()}
              disabled={nicknameMutation.isPending}
            >
              {nicknameMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [targetChannelId, setTargetChannelId] = useState("1471577369440686429");
  const [audioChannelId, setAudioChannelId] = useState("1471577369440686429");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reactChannelId, setReactChannelId] = useState("");
  const [reactMessageId, setReactMessageId] = useState("");
  const [reactEmoji, setReactEmoji] = useState("<:music_disc:1471990618828837139>");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const { data: botStatus, isLoading } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
  });

  const { data: botInfo } = useQuery<BotInfo>({
    queryKey: ["/api/discord/bot/info"],
  });

  const { data: servers } = useQuery<DiscordServer[]>({
    queryKey: ["/api/discord/servers"],
  });

  const joinVoiceMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await apiRequest("POST", "/api/discord/voice/join", { channelId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bot joined the voice channel." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const playUrlMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discord/voice/play-url", {
        channelId: audioChannelId,
        url: audioUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Audio started", description: "The bot is now playing audio." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const playFileMutation = useMutation({
    mutationFn: async () => {
      if (!audioFile) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("channelId", audioChannelId);
      formData.append("audio", audioFile);
      const res = await fetch("/api/discord/voice/play-file", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Audio started", description: "File is playing in the voice channel." });
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const stopAudioMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discord/voice/stop", {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Audio stopped", description: "Playback has ended." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discord/messages/react", {
        channelId: reactChannelId,
        messageId: reactMessageId,
        emoji: reactEmoji,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reaction sent", description: "Emoji added successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const setAvatarMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discord/bot/avatar", { imageUrl: avatarUrl });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Avatar updated", description: "The bot's global profile picture has been changed." });
      setAvatarUrl("");
      qc.invalidateQueries({ queryKey: ["/api/discord/bot/info"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const setBannerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discord/bot/banner", { imageUrl: bannerUrl });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Banner updated", description: "The bot's profile banner has been changed." });
      setBannerUrl("");
      qc.invalidateQueries({ queryKey: ["/api/discord/bot/info"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time status of your Minecraft Discord Bot
          </p>

          <ApiKeySection />
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${botStatus?.online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                    />
                    <span className="text-2xl font-bold">
                      {botStatus?.online ? "Online" : "Offline"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {botStatus?.status || "Switching Activities"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {botStatus?.uptime ? formatUptime(botStatus.uptime) : "0m"}
                  </div>
                  <p className="text-xs text-muted-foreground">Since last restart</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-sm font-medium">Servers</CardTitle>
                  <Server className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {botStatus?.serverCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Connected Guilds</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-sm font-medium">Version</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {botStatus?.version || "1.0.0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Stable Build</p>
                </CardContent>
              </Card>
            </div>

            {/* Bot Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Bot Appearance
                </CardTitle>
                <CardDescription>
                  Change the bot's global profile picture and banner, and set custom nicknames per server.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current profile preview */}
                {botInfo && (
                  <div className="flex items-center gap-4 p-4 rounded-md bg-muted/40">
                    <div className="relative">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={botInfo.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-lg">
                          {botInfo.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="font-semibold text-base">{botInfo.username}</p>
                      <p className="text-xs text-muted-foreground">ID: {botInfo.id}</p>
                      {botInfo.bannerUrl && (
                        <img
                          src={botInfo.bannerUrl}
                          alt="Bot banner"
                          className="mt-2 h-12 rounded-md object-cover w-48"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Avatar */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <ImageIcon className="w-4 h-4" />
                      Global Profile Picture (Avatar)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Applies to all servers. Paste a direct image URL (png, jpg, gif).
                    </p>
                    <div className="flex gap-2">
                      <Input
                        data-testid="input-bot-avatar-url"
                        placeholder="https://example.com/avatar.png"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        data-testid="button-set-avatar"
                        onClick={() => setAvatarMutation.mutate()}
                        disabled={setAvatarMutation.isPending || !avatarUrl}
                      >
                        {setAvatarMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Set"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Banner */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <ImageIcon className="w-4 h-4" />
                      Global Profile Banner
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Requires a verified bot account. Paste a direct image URL.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        data-testid="input-bot-banner-url"
                        placeholder="https://example.com/banner.png"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        data-testid="button-set-banner"
                        onClick={() => setBannerMutation.mutate()}
                        disabled={setBannerMutation.isPending || !bannerUrl}
                      >
                        {setBannerMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Set"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Per-server appearance */}
                {servers && servers.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Server className="w-4 h-4" />
                        Per-Server Settings
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Set a custom avatar and nickname for each server individually.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {servers.map((server) => (
                        <ServerAppearanceCard
                          key={server.id}
                          server={server}
                          appearance={botInfo?.serverAppearance?.[server.id]}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Voice Control */}
              <Card>
                <CardHeader>
                  <CardTitle>Voice Control</CardTitle>
                  <CardDescription>
                    Enter a channel ID to connect the bot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      data-testid="input-voice-channel-id"
                      placeholder="Voice Channel ID"
                      value={targetChannelId}
                      onChange={(e) => setTargetChannelId(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    data-testid="button-join-voice"
                    onClick={() => joinVoiceMutation.mutate(targetChannelId)}
                    disabled={joinVoiceMutation.isPending || !targetChannelId}
                    className="w-full gap-2"
                  >
                    {joinVoiceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    Join Voice Channel
                  </Button>
                </CardContent>
              </Card>

              {/* Reaction Control */}
              <Card>
                <CardHeader>
                  <CardTitle>Reaction Control</CardTitle>
                  <CardDescription>
                    Make the bot react to a specific message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-react-channel-id"
                        placeholder="Channel ID"
                        value={reactChannelId}
                        onChange={(e) => setReactChannelId(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-react-message-id"
                        placeholder="Message ID"
                        value={reactMessageId}
                        onChange={(e) => setReactMessageId(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <SmilePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-react-emoji"
                        placeholder="Emoji (e.g. <:name:id>)"
                        value={reactEmoji}
                        onChange={(e) => setReactEmoji(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    data-testid="button-add-reaction"
                    onClick={() => addReactionMutation.mutate()}
                    disabled={
                      addReactionMutation.isPending ||
                      !reactMessageId ||
                      !reactChannelId
                    }
                    className="w-full gap-2"
                  >
                    {addReactionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SmilePlus className="w-4 h-4" />
                    )}
                    Add Reaction
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Audio Playback */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Audio Playback
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Play audio in a voice channel via URL or file upload.{" "}
                      <span className="text-yellow-500 font-medium">
                        Only works on the deployed server (not in development mode).
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    data-testid="button-stop-audio"
                    variant="destructive"
                    onClick={() => stopAudioMutation.mutate()}
                    disabled={stopAudioMutation.isPending}
                    className="gap-2"
                  >
                    {stopAudioMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <StopCircle className="w-4 h-4" />
                    )}
                    Stop
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-audio-channel-id"
                    placeholder="Voice Channel ID"
                    value={audioChannelId}
                    onChange={(e) => setAudioChannelId(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Tabs defaultValue="url">
                  <TabsList className="w-full">
                    <TabsTrigger value="url" className="flex-1 gap-2">
                      <Link className="w-4 h-4" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex-1 gap-2">
                      <Upload className="w-4 h-4" />
                      File Upload
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-3 pt-3">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        YouTube, SoundCloud or direct audio URL (mp3, ogg, wav …)
                      </Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          data-testid="input-audio-url"
                          placeholder="https://..."
                          value={audioUrl}
                          onChange={(e) => setAudioUrl(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <Button
                      data-testid="button-play-url"
                      onClick={() => playUrlMutation.mutate()}
                      disabled={playUrlMutation.isPending || !audioUrl || !audioChannelId}
                      className="w-full gap-2"
                    >
                      {playUrlMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Music className="w-4 h-4" />
                      )}
                      Play URL
                    </Button>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-3 pt-3">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Upload audio file (mp3, ogg, wav, flac, m4a, webm · max 50 MB)
                      </Label>
                      <Input
                        data-testid="input-audio-file"
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.ogg,.wav,.flac,.m4a,.webm"
                        onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    {audioFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected:{" "}
                        <span className="font-medium text-foreground">{audioFile.name}</span>{" "}
                        ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    <Button
                      data-testid="button-play-file"
                      onClick={() => playFileMutation.mutate()}
                      disabled={playFileMutation.isPending || !audioFile || !audioChannelId}
                      className="w-full gap-2"
                    >
                      {playFileMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Play File
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
