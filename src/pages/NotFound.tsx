import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md mx-auto space-y-8">
        {/* Large 404 with football-themed styling */}
        <div className="relative">
          <h1 className="text-[8rem] sm:text-[10rem] font-black leading-none text-primary/10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Offside!
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            The page you're looking for has been moved, removed, or doesn't exist.
          </p>
          <p className="text-sm text-muted-foreground/70 font-mono">
            {location.pathname}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2" onClick={() => window.history.back()}>
            <span>
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
