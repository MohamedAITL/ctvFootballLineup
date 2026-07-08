import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LineupView from "@/pages/LineupView";
import TeamList from "@/pages/TeamList";
import TeamDetail from "@/pages/TeamDetail";
import { loadDbJson } from "@/lib/local-store";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LineupView} />
      <Route path="/teams" component={TeamList} />
      <Route path="/teams/:id" component={TeamDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => { loadDbJson(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
