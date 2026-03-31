import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hash, Volume2, Megaphone, Server as ServerIcon, Loader2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DiscordServer } from "@/types/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const getChannelIcon = (type: number) => {
  switch (type) {
    case 0:
      return <Hash className="w-4 h-4 text-muted-foreground" />;
    case 2:
      return <Volume2 className="w-4 h-4 text-muted-foreground" />;
    case 5:
      return <Megaphone className="w-4 h-4 text-muted-foreground" />;
    default:
      return <Hash className="w-4 h-4 text-muted-foreground" />;
  }
};

const getChannelTypeName = (type: number) => {
  switch (type) {
    case 0:
      return "Text";
    case 2:
      return "Voice";
    case 5:
      return "Announcement";
    default:
      return "Unknown";
  }
};

export default function Servers() {
  const { toast } = useToast();
  const { data: servers, isLoading } = useQuery<DiscordServer[]>({
    queryKey: ["/api/discord/servers"],
  });

  const inviteMutation = useMutation({
    mutationFn: async (serverId: string) => {
      const res = await apiRequest("POST", `/api/discord/servers/${serverId}/invite`);
      return res.json();
    },
    onSuccess: (data) => {
      window.open(data.inviteUrl, "_blank");
      toast({
        title: "Invite created",
        description: "The invite link was opened in a new tab.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Servers & Channels</h1>
          <p className="text-sm text-muted-foreground">
            Overview of all Discord servers the bot is active on
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : !servers || servers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ServerIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No servers found. The bot is not connected to any server yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {servers.map((server) => (
              <Card key={server.id} data-testid={`card-server-${server.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-4 flex-wrap">
                    {server.icon ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                        alt={server.name}
                        className="w-12 h-12 rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center">
                        <ServerIcon className="w-6 h-6 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-server-name-${server.id}`}>
                        {server.name}
                      </CardTitle>
                      <CardDescription>
                        {server.channels.length} channels available
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-server-id-${server.id}`}>
                      ID: {server.id}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => inviteMutation.mutate(server.id)}
                      disabled={inviteMutation.isPending}
                      data-testid={`button-create-invite-${server.id}`}
                    >
                      {inviteMutation.isPending && inviteMutation.variables === server.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Create Invite
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="channels" className="border-0">
                      <AccordionTrigger
                        className="text-sm font-medium hover:no-underline py-2"
                        data-testid={`accordion-channels-${server.id}`}
                      >
                        Show channels ({server.channels.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {server.channels
                            .sort((a, b) => a.position - b.position)
                            .map((channel) => (
                              <div
                                key={channel.id}
                                className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate"
                                data-testid={`channel-${channel.id}`}
                              >
                                {getChannelIcon(channel.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {channel.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getChannelTypeName(channel.type)}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono">
                                  {channel.id}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
