import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow } from "lucide-react";
import Image from "next/image";

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
          <Image
            src="https://picsum.photos/seed/datastudio/600/300"
            alt="Data Studio Placeholder"
            width={600}
            height={300}
            className="rounded-lg shadow-md object-cover mx-auto"
            data-ai-hint="flowchart nodes"
          />
          <p className="mt-4 text-muted-foreground">Data studio features are currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
