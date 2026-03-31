import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, User, Calendar, Trash2 } from "lucide-react";
import type { Application } from "@/types/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const getStatusColor = (status: string) => {
  switch (status) {
    case "New":
      return "bg-blue-500 text-white";
    case "Pending":
      return "bg-yellow-500 text-white";
    case "Accepted":
      return "bg-green-500 text-white";
    case "Rejected":
      return "bg-red-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Applications() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Success", description: "Application deleted successfully." });
      setApplicationToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete application.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/applications/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Success", description: "Status updated." });
      setSelectedApplication(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not update status.",
        variant: "destructive",
      });
    },
  });

  const filteredApplications =
    applications?.filter((app) =>
      selectedCategory === "All" ? true : app.category.includes(selectedCategory),
    ) || [];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Applications</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage server applications
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                {filteredApplications.length} application{filteredApplications.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Admin">Admin</TabsTrigger>
                <TabsTrigger value="Member">Member</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No applications found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => setSelectedApplication(app)}
                    data-testid={`card-application-${app.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-1 items-center">
                        <span className="font-medium truncate" data-testid={`text-applicant-${app.id}`}>
                          {app.discordName}
                        </span>
                        <Badge variant="outline">{app.category}</Badge>
                        <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.timestamp).toLocaleDateString("en-US")}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplication(app);
                        }}
                        data-testid={`button-view-${app.id}`}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setApplicationToDelete(app);
                        }}
                        data-testid={`button-delete-application-${app.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Submitted by {selectedApplication?.discordName}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs mt-1">{selectedApplication.discordId}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Category</p>
                  <Badge className="mt-1">{selectedApplication.category}</Badge>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Status</p>
                  <Badge className={`mt-1 ${getStatusColor(selectedApplication.status)}`}>
                    {selectedApplication.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Date</p>
                  <p className="text-xs mt-1">
                    {new Date(selectedApplication.timestamp).toLocaleDateString("en-US")}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground mb-2">Application Content</p>
                <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedApplication.content}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600"
                  onClick={() => updateStatusMutation.mutate({ id: selectedApplication.id, status: "Accepted" })}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-accept-application"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-yellow-600"
                  onClick={() => updateStatusMutation.mutate({ id: selectedApplication.id, status: "Pending" })}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-pending-application"
                >
                  Set Pending
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => updateStatusMutation.mutate({ id: selectedApplication.id, status: "Rejected" })}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-reject-application"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="ml-auto"
                  onClick={() => {
                    setApplicationToDelete(selectedApplication);
                    setSelectedApplication(null);
                  }}
                  data-testid="button-delete-from-dialog"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!applicationToDelete} onOpenChange={() => setApplicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application?</AlertDialogTitle>
            <AlertDialogDescription>
              The application from <strong>{applicationToDelete?.discordName}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applicationToDelete && deleteApplicationMutation.mutate(applicationToDelete.id)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              {deleteApplicationMutation.isPending ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
