import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

export default function ModelTrainingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Model Training</h1>
          <p className="text-muted-foreground">
            Train machine learning models like Logistic Regression.
          </p>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Machine Learning Model Training</CardTitle>
          <CardDescription>
            Implement and train models, select parameters, and understand algorithms. Includes model serialization.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          {/* Image removed */}
          <p className="mt-4 text-muted-foreground">Model training features are currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
