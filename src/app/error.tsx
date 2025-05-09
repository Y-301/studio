"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Oops, something went wrong!</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We encountered an unexpected error. Please try again, or contact support if the problem persists.
      </p>
      <p className="text-sm text-destructive/80 mb-6">
        {error.message || "An unknown error occurred."}
      </p>
      <div className="flex gap-4">
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go to Homepage
        </Button>
      </div>
    </div>
  );
}
