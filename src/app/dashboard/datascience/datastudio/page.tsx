import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow } from "lucide-react";

export default function DataStudioPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Workflow className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Data Studio</h1>
          <p className="text-muted-foreground">
            Process, transform, and prepare your data for analysis.
          </p>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Data Processing & Preprocessing</CardTitle>
          <CardDescription>
            Tools for data cleaning, normalization, transformation, feature extraction, and outlier detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          {/* Image removed */}
          <p className="mt-4 text-muted-foreground">Data studio features are currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
