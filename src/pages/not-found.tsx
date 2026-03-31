import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full bg-background p-6">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Seite nicht gefunden</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>
        <Button asChild data-testid="button-home">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
