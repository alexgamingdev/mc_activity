import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import Servers from "@/pages/servers";
import SendMessagePage from "@/pages/send-message";
import Applications from "@/pages/applications";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/servers" component={Servers} />
      <Route path="/send-message" component={SendMessagePage} />
      <Route path="/applications" component={Applications} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full overflow-hidden">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 bg-background/95 backdrop-blur">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h1 className="text-sm font-medium text-muted-foreground">
                  Minecraft Bot Portal
                </h1>
              </header>
              {/* ÄNDERUNG HIER: overflow-y-auto erlaubt das Scrollen im Hauptfenster */}
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
