
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Play, FileText, Cog, Activity, BarChartHorizontalBig, UploadCloud } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const mockDatasets = [
  { id: "1", name: "processed_sleep_features.csv" },
  { id: "2", name: "cleaned_device_interactions.json" },
];

const modelTypes = [
  { id: "logistic_regression", name: "Logistic Regression" },
  { id: "decision_tree", name: "Decision Tree Classifier" },
  { id: "random_forest", name: "Random Forest Classifier" },
  { id: "svm", name: "Support Vector Machine (SVM)" },
  { id: "time_series_arima", name: "ARIMA (Time Series)" },
];

export default function ModelTrainingPage() {
  const [selectedDataset, setSelectedDataset] = useState<string | undefined>(mockDatasets[0]?.id);
  const [selectedModelType, setSelectedModelType] = useState<string | undefined>(modelTypes[0]?.id);
  const [trainingLog, setTrainingLog] = useState<string>("Training logs will appear here...");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const { toast } = useToast();

  // Mock parameters - these would be dynamic based on selectedModelType
  const [learningRate, setLearningRate] = useState("0.01");
  const [epochs, setEpochs] = useState("100");
  const [maxDepth, setMaxDepth] = useState("5"); // For tree-based models

  const handleTrainModel = () => {
    if (!selectedDataset || !selectedModelType) {
      toast({ title: "Missing Selection", description: "Please select a dataset and model type.", variant: "destructive" });
      return;
    }
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLog(`--- Starting Training (Demo) ---\nDataset: ${mockDatasets.find(d=>d.id === selectedDataset)?.name}\nModel: ${modelTypes.find(m=>m.id === selectedModelType)?.name}\nParameters: LR=${learningRate}, Epochs=${epochs}, MaxDepth=${maxDepth}\n`);
    
    let progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
            const newProgress = prev + 10;
            if (newProgress >= 100) {
                clearInterval(progressInterval);
                setIsTraining(false);
                setTrainingLog(prev => prev + "\n--- Training Completed Successfully (Demo) ---\nModel saved as 'trained_model_demo.pkl'");
                toast({ title: "Training Complete (Demo)", description: "Model has been trained and saved." });
                return 100;
            }
            setTrainingLog(prev => prev + `Epoch ${newProgress/10}/10 - Accuracy: ${(0.6 + newProgress/500).toFixed(3)}\n`);
            return newProgress;
        });
    }, 500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Model Training</h1>
            <p className="text-muted-foreground">
              Train machine learning models on your processed datasets.
            </p>
          </div>
        </div>
        <Button onClick={handleTrainModel} size="lg" disabled={isTraining}>
          {isTraining ? <Activity className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
          {isTraining ? "Training..." : "Start Training"}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Select data and model parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dataset-select">Training Dataset</Label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset} disabled={isTraining}>
                <SelectTrigger id="dataset-select">
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {mockDatasets.map(ds => <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="model-type-select">Model Type</Label>
              <Select value={selectedModelType} onValueChange={setSelectedModelType} disabled={isTraining}>
                <SelectTrigger id="model-type-select">
                  <SelectValue placeholder="Choose model type" />
                </SelectTrigger>
                <SelectContent>
                  {modelTypes.map(mt => <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             {/* Dynamic Parameters based on selectedModelType - simplified example */}
            {selectedModelType === 'logistic_regression' && (
                <>
                    <div><Label htmlFor="lr">Learning Rate</Label><Input id="lr" value={learningRate} onChange={e => setLearningRate(e.target.value)} disabled={isTraining} /></div>
                    <div><Label htmlFor="epochs">Epochs</Label><Input id="epochs" type="number" value={epochs} onChange={e => setEpochs(e.target.value)} disabled={isTraining} /></div>
                </>
            )}
            {(selectedModelType === 'decision_tree' || selectedModelType === 'random_forest') && (
                 <div><Label htmlFor="max-depth">Max Depth</Label><Input id="max-depth" type="number" value={maxDepth} onChange={e => setMaxDepth(e.target.value)} disabled={isTraining} /></div>
            )}
             <div>
                <Button variant="outline" className="w-full mt-2" disabled={isTraining} onClick={() => toast({title: "Advanced Settings (Demo)", description: "Configure advanced model parameters."})}>
                    <Cog className="mr-2 h-4 w-4" /> Advanced Parameters
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Training Process</CardTitle>
            <CardDescription>Monitor the training progress and logs.</CardDescription>
          </CardHeader>
          <CardContent>
            {isTraining && (
                <div className="mb-4">
                    <Label>Training Progress: {trainingProgress}%</Label>
                    <Progress value={trainingProgress} className="w-full h-3 mt-1" />
                </div>
            )}
            <Label htmlFor="training-log">Training Log</Label>
            <Textarea id="training-log" value={trainingLog} readOnly rows={12} className="font-mono text-xs bg-muted/50" />
             <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" disabled={isTraining} onClick={() => toast({ title: "View Metrics (Demo)", description: "Detailed training metrics would appear here."})}>
                    <BarChartHorizontalBig className="mr-2 h-4 w-4" /> View Metrics
                </Button>
                 <Button variant="default" size="sm" disabled={isTraining || trainingProgress < 100} onClick={() => toast({ title: "Model Saved (Demo)", description: "Model 'trained_model_demo.pkl' has been serialized."})}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Save Model
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Algorithm Explanation</CardTitle>
            <CardDescription>Brief overview of the selected model ({modelTypes.find(m=>m.id === selectedModelType)?.name || "N/A"}).</CardDescription>
        </CardHeader>
        <CardContent>
            {selectedModelType === 'logistic_regression' && (
                <p className="text-sm text-muted-foreground">
                    Logistic Regression is a statistical model used for binary classification problems. It predicts the probability of an outcome by fitting data to a logistic function.
                    Key concepts include the sigmoid function, log-odds, and gradient descent for optimization.
                </p>
            )}
            {selectedModelType === 'decision_tree' && (
                 <p className="text-sm text-muted-foreground">
                    A Decision Tree Classifier creates a tree-like model of decisions. It splits data based on feature values to make predictions. 
                    It's intuitive but can be prone to overfitting.
                </p>
            )}
            {/* Add more explanations as needed */}
            {!selectedModelType && <p className="text-sm text-muted-foreground">Select a model type to see its explanation.</p>}
        </CardContent>
      </Card>

    </div>
  );
}
