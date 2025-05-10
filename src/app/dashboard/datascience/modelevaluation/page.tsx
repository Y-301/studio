import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function ModelEvaluationPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <ClipboardCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Model Evaluation</h1>
          <p className="text-muted-foreground">
            Evaluate model performance and optimize your models.
          </p>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Model Performance & Optimization</CardTitle>
          <CardDescription>
            Tools for hyperparameter tuning, cross-validation, model comparison, and visualizing performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          {/* Image removed */}
          <p className="mt-4 text-muted-foreground">Model evaluation features are currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
