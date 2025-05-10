
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, BarChartBig, Settings2, Percent, CheckSquare, Target, AlertCircle, UploadCloud } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

const mockModels = [
  { id: "model_lr_v1", name: "Logistic Regression (Sleep_v1)", date: "2024-09-10" },
  { id: "model_rf_v2", name: "Random Forest (Activity_v2)", date: "2024-09-12" },
  { id: "model_arima_v1", name: "ARIMA (Energy_Forecast_v1)", date: "2024-09-15" },
];

const mockDatasets = [
  { id: "test_data_sleep", name: "test_sleep_features_q3.csv" },
  { id: "test_data_activity", name: "validation_activity_data.json" },
];

// Mock evaluation data - this would be dynamically generated
const mockEvaluationMetrics = {
    accuracy: 0.88,
    precision: 0.85,
    recall: 0.90,
    f1Score: 0.87,
    aucRoc: 0.92,
    confusionMatrix: [[75, 5], [10, 110]], // TN, FP, FN, TP
};

const mockFeatureImportance = [
    { feature: "avg_hr_deep_sleep", importance: 0.35, fill: "hsl(var(--chart-1))" },
    { feature: "steps_previous_day", importance: 0.25, fill: "hsl(var(--chart-2))"  },
    { feature: "time_in_bed", importance: 0.20, fill: "hsl(var(--chart-3))"  },
    { feature: "weekend_flag", importance: 0.15, fill: "hsl(var(--chart-4))"  },
    { feature: "caffeine_intake", importance: 0.05, fill: "hsl(var(--chart-5))"  },
];
const chartConfigFeatureImportance = {
  importance: { label: "Importance" },
  "avg_hr_deep_sleep": { label: "Avg HR Deep Sleep", color: "hsl(var(--chart-1))" },
  "steps_previous_day": { label: "Steps Prev Day", color: "hsl(var(--chart-2))" },
  "time_in_bed": { label: "Time in Bed", color: "hsl(var(--chart-3))" },
  "weekend_flag": { label: "Weekend", color: "hsl(var(--chart-4))" },
  "caffeine_intake": { label: "Caffeine", color: "hsl(var(--chart-5))" },
}


export default function ModelEvaluationPage() {
  const [selectedModel, setSelectedModel] = useState<string | undefined>(mockModels[0]?.id);
  const [selectedDataset, setSelectedDataset] = useState<string | undefined>(mockDatasets[0]?.id);
  const [evaluationResults, setEvaluationResults] = useState<typeof mockEvaluationMetrics | null>(null);
  const { toast } = useToast();

  const handleEvaluateModel = () => {
    if (!selectedModel || !selectedDataset) {
      toast({ title: "Missing Selection", description: "Please select a model and a dataset.", variant: "destructive" });
      return;
    }
    // Simulate evaluation
    toast({ title: "Evaluation Started (Demo)", description: `Evaluating ${mockModels.find(m=>m.id === selectedModel)?.name} on ${mockDatasets.find(d=>d.id === selectedDataset)?.name}.` });
    setTimeout(() => {
        setEvaluationResults(mockEvaluationMetrics);
        toast({ title: "Evaluation Complete (Demo)", description: "Metrics are now displayed." });
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Model Evaluation</h1>
            <p className="text-muted-foreground">
              Assess model performance, tune hyperparameters, and compare models.
            </p>
          </div>
        </div>
        <Button onClick={handleEvaluateModel} size="lg">
            <BarChartBig className="mr-2 h-5 w-5" /> Evaluate Model
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Evaluation Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="model-select">Select Model for Evaluation</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Choose a trained model" />
              </SelectTrigger>
              <SelectContent>
                {mockModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name} (Trained: {m.date})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dataset-select">Select Evaluation Dataset</Label>
            <Select value={selectedDataset} onValueChange={setSelectedDataset}>
              <SelectTrigger id="dataset-select">
                <SelectValue placeholder="Choose an evaluation dataset" />
              </SelectTrigger>
              <SelectContent>
                {mockDatasets.map(ds => <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div className="md:col-span-2">
                <Button variant="outline" className="w-full" onClick={() => toast({title: "Hyperparameter Tuning (Demo)", description: "Configure and run hyperparameter optimization."})}>
                    <Settings2 className="mr-2 h-4 w-4" /> Hyperparameter Tuning
                </Button>
            </div>
        </CardContent>
      </Card>

    {evaluationResults && (
        <>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key indicators for the selected model and dataset.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                <Card className="p-4"><Percent className="mx-auto h-6 w-6 mb-1 text-primary"/><CardTitle className="text-2xl">{evaluationResults.accuracy.toFixed(2)}</CardTitle><CardDescription>Accuracy</CardDescription></Card>
                <Card className="p-4"><Target className="mx-auto h-6 w-6 mb-1 text-primary"/><CardTitle className="text-2xl">{evaluationResults.precision.toFixed(2)}</CardTitle><CardDescription>Precision</CardDescription></Card>
                <Card className="p-4"><CheckSquare className="mx-auto h-6 w-6 mb-1 text-primary"/><CardTitle className="text-2xl">{evaluationResults.recall.toFixed(2)}</CardTitle><CardDescription>Recall</CardDescription></Card>
                <Card className="p-4"><BarChartBig className="mx-auto h-6 w-6 mb-1 text-primary"/><CardTitle className="text-2xl">{evaluationResults.f1Score.toFixed(2)}</CardTitle><CardDescription>F1-Score</CardDescription></Card>
                <Card className="p-4"><BarChartBig className="mx-auto h-6 w-6 mb-1 text-primary"/><CardTitle className="text-2xl">{evaluationResults.aucRoc.toFixed(2)}</CardTitle><CardDescription>AUC-ROC</CardDescription></Card>
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
                <CardHeader><CardTitle>Confusion Matrix</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead></TableHead><TableHead>Predicted Negative</TableHead><TableHead>Predicted Positive</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow><TableCell className="font-medium">Actual Negative</TableCell><TableCell>{evaluationResults.confusionMatrix[0][0]}</TableCell><TableCell>{evaluationResults.confusionMatrix[0][1]}</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium">Actual Positive</TableCell><TableCell>{evaluationResults.confusionMatrix[1][0]}</TableCell><TableCell>{evaluationResults.confusionMatrix[1][1]}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card className="shadow-lg">
                <CardHeader><CardTitle>Feature Importance</CardTitle></CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfigFeatureImportance} className="h-[250px] w-full">
                        <BarChart data={mockFeatureImportance} layout="vertical" margin={{ left: 30, right:10 }}>
                            <CartesianGrid horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="feature" type="category" width={100} tick={{fontSize: 10}}/>
                            <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--muted))'}} />
                            <Bar dataKey="importance" radius={4}>
                                {mockFeatureImportance.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
        </>
    )}
    {!evaluationResults && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertCircle className="h-6 w-6 text-amber-500"/>No Evaluation Data</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12 text-muted-foreground">
                <p>Select a model and dataset, then click "Evaluate Model" to see performance metrics.</p>
            </CardContent>
        </Card>
    )}

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Model Comparison & Deployment</CardTitle>
            <CardDescription>Compare different models or versions and prepare for deployment.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={() => toast({title: "Model Comparison (Demo)", description: "Select models to compare side-by-side."})}>
                Compare Models
            </Button>
             <Button variant="outline" onClick={() => toast({title: "View ROC Curve (Demo)", description: "Displaying ROC curve for the selected model."})}>
                View ROC Curve
            </Button>
            <Button onClick={() => toast({title: "Export Model (Demo)", description: "Model artifact is being prepared for download."})}>
                <UploadCloud className="mr-2 h-4 w-4" /> Export Model
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
