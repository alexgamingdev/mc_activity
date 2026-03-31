import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Info, User, Hash, Trash2, Plus, X } from "lucide-react";
import type { DiscordServer } from "@/types/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const fieldSchema = z.object({
  name: z.string().min(1, "Field name required"),
  value: z.string().min(1, "Field value required"),
  inline: z.boolean().default(false),
});

const formSchema = z.object({
  type: z.enum(["channel", "dm"]).default("channel"),
  serverId: z.string().optional(),
  channelId: z.string().optional(),
  userId: z.string().optional(),
  replyTo: z.string().optional(),
  content: z.string().max(2000, "Message is too long").optional(),
  useEmbed: z.boolean().default(false),
  embedTitle: z.string().optional(),
  embedDescription: z.string().optional(),
  embedColor: z.string().default("#d32f2f"),
  embedThumbnail: z.string().optional(),
  embedImage: z.string().optional(),
  embedAuthorName: z.string().optional(),
  embedAuthorUrl: z.string().optional(),
  embedAuthorIconUrl: z.string().optional(),
  embedFooterText: z.string().optional(),
  embedFooterIconUrl: z.string().optional(),
  embedTimestamp: z.boolean().default(false),
  embedFields: z.array(fieldSchema).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function SendMessagePage() {
  const { toast } = useToast();
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [deleteChannelId, setDeleteChannelId] = useState("");
  const [deleteMessageId, setDeleteMessageId] = useState("");

  const { data: servers, isLoading: serversLoading } = useQuery<DiscordServer[]>({
    queryKey: ["/api/discord/servers"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "channel",
      serverId: "",
      channelId: "",
      userId: "",
      replyTo: "",
      content: "",
      useEmbed: false,
      embedTitle: "",
      embedDescription: "",
      embedColor: "#d32f2f",
      embedThumbnail: "",
      embedImage: "",
      embedAuthorName: "",
      embedAuthorUrl: "",
      embedAuthorIconUrl: "",
      embedFooterText: "",
      embedFooterIconUrl: "",
      embedTimestamp: false,
      embedFields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "embedFields",
  });

  const messageType = form.watch("type");
  const useEmbed = form.watch("useEmbed");

  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const endpoint =
        data.type === "dm" ? "/api/discord/send-dm" : "/api/discord/send-message";

      const payload: any = {
        content: data.content || undefined,
        replyTo: data.replyTo || undefined,
        ...(data.type === "dm"
          ? { userId: data.userId }
          : { channelId: data.channelId }),
      };

      if (data.useEmbed) {
        payload.embed = {
          title: data.embedTitle || undefined,
          description: data.embedDescription || undefined,
          color: data.embedColor,
          thumbnail: data.embedThumbnail || undefined,
          image: data.embedImage || undefined,
          authorName: data.embedAuthorName || undefined,
          authorUrl: data.embedAuthorUrl || undefined,
          authorIconUrl: data.embedAuthorIconUrl || undefined,
          footerText: data.embedFooterText || undefined,
          footerIconUrl: data.embedFooterIconUrl || undefined,
          timestamp: data.embedTimestamp,
          fields: data.embedFields,
        };
      }

      return await apiRequest("POST", endpoint, payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Message sent successfully!" });
      form.reset({ ...form.getValues(), content: "", embedTitle: "", embedDescription: "", embedFields: [] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async () => {
      if (!deleteChannelId || !deleteMessageId)
        throw new Error("Channel ID and Message ID are required");
      return await apiRequest("DELETE", `/api/discord/messages/${deleteChannelId}/${deleteMessageId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Message deleted successfully!" });
      setDeleteChannelId("");
      setDeleteMessageId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message.",
        variant: "destructive",
      });
    },
  });

  const selectedServerData = servers?.find((s) => s.id === selectedServer);
  const availableChannels =
    selectedServerData?.channels.filter((c) => c.type === 0 || c.type === 5) || [];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Send Message</h1>
          <p className="text-sm text-muted-foreground">
            Broadcast to channels or send direct messages
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Message Composer</CardTitle>
            <CardDescription>Select your destination and craft your message</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => sendMessageMutation.mutate(data))}
                className="space-y-6"
              >
                {/* Message type toggle */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel>Destination</FormLabel>
                        <FormDescription>
                          {field.value === "channel" ? "Sending to a server channel" : "Sending a direct message"}
                        </FormDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={field.value === "channel" ? "default" : "outline"}
                          onClick={() => field.onChange("channel")}
                          size="sm"
                          data-testid="button-type-channel"
                        >
                          <Hash className="w-4 h-4 mr-1" /> Channel
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "dm" ? "default" : "outline"}
                          onClick={() => field.onChange("dm")}
                          size="sm"
                          data-testid="button-type-dm"
                        >
                          <User className="w-4 h-4 mr-1" /> DM
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Channel / DM selection */}
                {messageType === "channel" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="serverId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Server</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                setSelectedServer(val);
                                form.setValue("channelId", "");
                              }}
                              disabled={serversLoading}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-server">
                                  <SelectValue placeholder="Select server" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {servers?.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="channelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Channel</FormLabel>
                            <Select onValueChange={field.onChange} disabled={!selectedServer}>
                              <FormControl>
                                <SelectTrigger data-testid="select-channel">
                                  <SelectValue placeholder="Select channel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableChannels.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    # {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="replyTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reply to Message ID (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 123456789012345678" {...field} data-testid="input-reply-to" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord User ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 123456789012345678" {...field} data-testid="input-user-id" />
                        </FormControl>
                        <FormDescription>The bot must share a server with the user.</FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                {/* Message content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your message here..."
                          rows={4}
                          {...field}
                          data-testid="textarea-content"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Info className="w-3 h-3 shrink-0" />
                          <span>User: <code className="bg-muted px-1 rounded">&lt;@USER_ID&gt;</code></span>
                          <span>·</span>
                          <span>Role: <code className="bg-muted px-1 rounded">&lt;@&ROLE_ID&gt;</code></span>
                          <span>·</span>
                          <span>Channel: <code className="bg-muted px-1 rounded">&lt;#CHANNEL_ID&gt;</code></span>
                        </div>
                        <span className="shrink-0">{field.value?.length || 0} / 2000</span>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Embed toggle */}
                <div className="border-t pt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="useEmbed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Rich Embed</FormLabel>
                          <FormDescription>Format message as a Discord Embed</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-use-embed"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {useEmbed && (
                    <div className="space-y-5 p-4 rounded-lg bg-muted/20 border">
                      {/* Color & Timestamp */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <FormField
                          control={form.control}
                          name="embedColor"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-3">
                              <FormLabel className="shrink-0">Color</FormLabel>
                              <FormControl>
                                <input
                                  type="color"
                                  className="w-10 h-10 rounded cursor-pointer border border-border"
                                  {...field}
                                  data-testid="input-embed-color"
                                />
                              </FormControl>
                              <Input
                                className="w-28"
                                placeholder="#d32f2f"
                                value={field.value}
                                onChange={field.onChange}
                                data-testid="input-embed-color-hex"
                              />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="embedTimestamp"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 ml-auto">
                              <FormLabel>Timestamp</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-embed-timestamp"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Author */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Author</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <FormField
                            control={form.control}
                            name="embedAuthorName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Author name" {...field} data-testid="input-embed-author-name" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="embedAuthorUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} data-testid="input-embed-author-url" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="embedAuthorIconUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} data-testid="input-embed-author-icon" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Title & Description */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Content</p>
                        <FormField
                          control={form.control}
                          name="embedTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Embed title" {...field} data-testid="input-embed-title" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="embedDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Embed description" rows={3} {...field} data-testid="textarea-embed-description" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Thumbnail & Image */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Images</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="embedThumbnail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thumbnail URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} data-testid="input-embed-thumbnail" />
                                </FormControl>
                                <FormDescription>Small image in the top-right corner</FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="embedImage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Image URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} data-testid="input-embed-image" />
                                </FormControl>
                                <FormDescription>Large image at the bottom of the embed</FormDescription>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Fields */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-muted-foreground">Fields</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: "", value: "", inline: false })}
                            data-testid="button-add-field"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Field
                          </Button>
                        </div>
                        {fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end p-3 border rounded-md"
                          >
                            <FormField
                              control={form.control}
                              name={`embedFields.${index}.name`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Field name" {...f} data-testid={`input-field-name-${index}`} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`embedFields.${index}.value`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Value</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Field value" {...f} data-testid={`input-field-value-${index}`} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`embedFields.${index}.inline`}
                              render={({ field: f }) => (
                                <FormItem className="flex flex-col items-center">
                                  <FormLabel>Inline</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={f.value}
                                      onCheckedChange={f.onChange}
                                      data-testid={`switch-field-inline-${index}`}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              data-testid={`button-remove-field-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Footer */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Footer</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="embedFooterText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Footer Text</FormLabel>
                                <FormControl>
                                  <Input placeholder="Footer text" {...field} data-testid="input-embed-footer-text" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="embedFooterIconUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Footer Icon URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} data-testid="input-embed-footer-icon" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="mr-2 animate-spin" />
                  ) : (
                    <Send className="mr-2 w-4 h-4" />
                  )}
                  Send Message
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Delete Message */}
        <Card>
          <CardHeader>
            <CardTitle>Delete Message</CardTitle>
            <CardDescription>Enter the Channel ID and Message ID separately</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Channel ID</label>
                  <Input
                    placeholder="e.g. 1443318323017420891"
                    value={deleteChannelId}
                    onChange={(e) => setDeleteChannelId(e.target.value)}
                    data-testid="input-delete-channel-id"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Message ID</label>
                  <Input
                    placeholder="e.g. 1471981340231467101"
                    value={deleteMessageId}
                    onChange={(e) => setDeleteMessageId(e.target.value)}
                    data-testid="input-delete-message-id"
                  />
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => deleteMessageMutation.mutate()}
                disabled={deleteMessageMutation.isPending || !deleteChannelId || !deleteMessageId}
                data-testid="button-delete-message"
              >
                {deleteMessageMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2 w-4 h-4" />
                ) : (
                  <Trash2 className="mr-2 w-4 h-4" />
                )}
                Delete Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
