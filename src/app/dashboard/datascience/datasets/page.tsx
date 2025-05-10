import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function DatasetsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Datasets</h1>
          <p className="text-muted-foreground">
            Upload, manage, and visualize your datasets.
          </p>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Dataset Management</CardTitle>
          <CardDescription>
            Functionality for uploading, previewing, storing time-series data, assessing data quality (CSV, JSON), and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          {/* Image removed */}
          <p className="mt-4 text-muted-foreground">Dataset management features are currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
