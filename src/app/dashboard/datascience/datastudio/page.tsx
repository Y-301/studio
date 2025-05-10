
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Workflow, Settings2, Play, Eye, BarChart2, AlertTriangle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

const mockDatasets = [
  { id: "1", name: "wristband_sleep_data_2024_q1.csv" },
  { id: "2", name: "device_usage_patterns_august.json" },
  { id: "3", name: "energy_consumption_timeseries.csv" },
];

const cleaningMethods = ["remove_duplicates", "handle_missing_values_mean", "handle_missing_values_median", "remove_outliers_iqr"];
const normalizationTechniques = ["min_max_scaling", "z_score_standardization"];
const transformationFunctions = ["log_transform", "square_root_transform", "box_cox_transform"];
const featureExtractionMethods = ["rolling_mean_7d", "time_since_last_event", "seasonal_decomposition"];


export default function DataStudioPage() {
  const [selectedDataset, setSelectedDataset] = useState<string | undefined>(mockDatasets[0]?.id);
  const [selectedCleaning, setSelectedCleaning] = useState<string | undefined>();
  const [selectedNormalization, setSelectedNormalization] = useState<string | undefined>();
  const [selectedTransformation, setSelectedTransformation] = useState<string | undefined>();
  const [selectedFeatureExtraction, setSelectedFeatureExtraction] = useState<string | undefined>();
  const [outputLog, setOutputLog] = useState<string>("Console output will appear here...");
  const { toast } = useToast();

  const handleApplyStep = (stepName: string, value?: string) => {
    if (!selectedDataset) {
        toast({ title: "No Dataset Selected", description: "Please select a dataset first.", variant: "destructive" });
        return;
    }
    if (!value) {
        toast({ title: "No Method Selected", description: `Please select a method for ${stepName}.`, variant: "destructive" });
        return;
    }
    const logMessage = `Applied ${stepName}: ${value} to dataset ${mockDatasets.find(d=>d.id === selectedDataset)?.name}.\n`;
    setOutputLog(prev => prev === "Console output will appear here..." ? logMessage : prev + logMessage);
    toast({ title: "Step Applied (Demo)", description: `${stepName} with ${value} applied.` });
  };
  
  const handleRunPipeline = () => {
    if (!selectedDataset) {
        toast({ title: "No Dataset Selected", description: "Please select a dataset to run the pipeline.", variant: "destructive" });
        return;
    }
     setOutputLog(prev => prev + "\n--- Running full pipeline (Demo) ---\n");
     if(selectedCleaning) handleApplyStep("Cleaning", selectedCleaning);
     if(selectedNormalization) handleApplyStep("Normalization", selectedNormalization);
     if(selectedTransformation) handleApplyStep("Transformation", selectedTransformation);
     if(selectedFeatureExtraction) handleApplyStep("Feature Extraction", selectedFeatureExtraction);
     setOutputLog(prev => prev + "--- Pipeline finished (Demo) ---\n");
     toast({ title: "Pipeline Executed (Demo)", description: "All selected steps have been processed." });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Workflow className="h-8 w-8 text-primary" />
            <div>
            <h1 className="text-3xl font-bold">Data Studio</h1>
            <p className="text-muted-foreground">
                Process, transform, and prepare your data for analysis.
            </p>
            </div>
        </div>
        <Button onClick={handleRunPipeline} size="lg">
            <Play className="mr-2 h-5 w-5" /> Run Pipeline
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="dataset-select">Select Dataset</Label>
          <Select value={selectedDataset} onValueChange={setSelectedDataset}>
            <SelectTrigger id="dataset-select">
              <SelectValue placeholder="Choose a dataset" />
            </SelectTrigger>
            <SelectContent>
              {mockDatasets.map(ds => <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Cleaning</CardTitle>
            <CardDescription className="text-xs">Remove noise and errors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedCleaning} onValueChange={setSelectedCleaning}>
              <SelectTrigger><SelectValue placeholder="Select Method" /></SelectTrigger>
              <SelectContent>
                {cleaningMethods.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full" onClick={() => handleApplyStep("Cleaning", selectedCleaning)}>Apply Step</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Normalization</CardTitle>
            <CardDescription className="text-xs">Scale data to a common range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedNormalization} onValueChange={setSelectedNormalization}>
              <SelectTrigger><SelectValue placeholder="Select Technique" /></SelectTrigger>
              <SelectContent>
                {normalizationTechniques.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full" onClick={() => handleApplyStep("Normalization", selectedNormalization)}>Apply Step</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transformation</CardTitle>
            <CardDescription className="text-xs">Modify data distribution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             <Select value={selectedTransformation} onValueChange={setSelectedTransformation}>
              <SelectTrigger><SelectValue placeholder="Select Function" /></SelectTrigger>
              <SelectContent>
                {transformationFunctions.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full" onClick={() => handleApplyStep("Transformation", selectedTransformation)}>Apply Step</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Extraction</CardTitle>
            <CardDescription className="text-xs">Create new relevant features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedFeatureExtraction} onValueChange={setSelectedFeatureExtraction}>
              <SelectTrigger><SelectValue placeholder="Select Method" /></SelectTrigger>
              <SelectContent>
                {featureExtractionMethods.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full" onClick={() => handleApplyStep("Feature Extraction", selectedFeatureExtraction)}>Apply Step</Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Output & Logs</CardTitle>
          <CardDescription>Results and logs from processing steps will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={outputLog} readOnly rows={10} className="font-mono text-xs bg-muted/50" />
           <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => toast({ title: "Preview (Demo)", description: "Showing data preview..."})}>
                    <Eye className="mr-2 h-4 w-4" /> Preview Data
                </Button>
                <Button variant="secondary" size="sm" onClick={() => toast({ title: "Visualize (Demo)", description: "Generating visualizations..."})}>
                    <BarChart2 className="mr-2 h-4 w-4" /> Visualize
                </Button>
                 <Button variant="destructive" size="sm" onClick={() => {
                    setOutputLog("Console output will appear here...");
                    toast({ title: "Log Cleared", description: "Output log has been reset." });
                 }}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> Clear Log
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
