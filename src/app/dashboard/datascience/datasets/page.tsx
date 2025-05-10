
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, UploadCloud, Eye, Trash2, FileJson, FileCsv } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface MockDataset {
  id: string;
  name: string;
  type: 'CSV' | 'JSON' | 'Other';
  size: string;
  lastModified: string;
  status: 'Uploaded' | 'Processing' | 'Error';
}

const initialMockDatasets: MockDataset[] = [
  { id: "1", name: "wristband_sleep_data_2024_q1.csv", type: "CSV", size: "2.5 MB", lastModified: "2024-07-01", status: "Uploaded" },
  { id: "2", name: "device_usage_patterns_august.json", type: "JSON", size: "1.1 MB", lastModified: "2024-08-15", status: "Uploaded" },
  { id: "3", name: "energy_consumption_timeseries.csv", type: "CSV", size: "5.0 MB", lastModified: "2024-09-05", status: "Processing" },
];

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<MockDataset[]>(initialMockDatasets);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    // Simulate upload
    const newDataset: MockDataset = {
      id: String(Date.now()),
      name: selectedFile.name,
      type: selectedFile.name.endsWith('.csv') ? 'CSV' : (selectedFile.name.endsWith('.json') ? 'JSON' : 'Other'),
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      lastModified: new Date().toISOString().split('T')[0],
      status: 'Uploaded',
    };
    setDatasets(prev => [newDataset, ...prev]);
    setSelectedFile(null); // Clear selected file
    if (document.getElementById('dataset-upload') as HTMLInputElement) {
        (document.getElementById('dataset-upload') as HTMLInputElement).value = "";
    }
    toast({ title: "Upload Successful (Demo)", description: `${selectedFile.name} has been added to the list.` });
  };

  const handleDeleteDataset = (id: string) => {
    // Simulate deletion
    setDatasets(prev => prev.filter(ds => ds.id !== id));
    toast({ title: "Dataset Deleted (Demo)", description: "The dataset has been removed from the list." });
  };
  
  const getFileIcon = (type: MockDataset['type']) => {
    if (type === 'CSV') return <FileCsv className="h-5 w-5 text-green-600" />;
    if (type === 'JSON') return <FileJson className="h-5 w-5 text-amber-500" />;
    return <Database className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Database className="h-8 w-8 text-primary" />
            <div>
            <h1 className="text-3xl font-bold">Datasets</h1>
            <p className="text-muted-foreground">
                Upload, manage, and prepare your datasets for analysis.
            </p>
            </div>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload New Dataset</CardTitle>
          <CardDescription>
            Upload CSV or JSON files containing time-series data or other relevant information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="dataset-upload" className="sr-only">Choose file</label>
              <Input id="dataset-upload" type="file" onChange={handleFileChange} accept=".csv,.json" />
            </div>
            <Button onClick={handleUpload} disabled={!selectedFile}>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Dataset
            </Button>
          </div>
          {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manage Datasets</CardTitle>
          <CardDescription>
            View, preview, and manage your uploaded datasets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datasets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell>{getFileIcon(dataset.type)}</TableCell>
                    <TableCell className="font-medium">{dataset.name}</TableCell>
                    <TableCell>{dataset.size}</TableCell>
                    <TableCell>{dataset.lastModified}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            dataset.status === 'Uploaded' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            dataset.status === 'Processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                            {dataset.status}
                        </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => toast({ title: "Preview (Demo)", description: `Showing preview for ${dataset.name}`})}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDataset(dataset.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-12 text-muted-foreground">
                <UploadCloud className="mx-auto h-12 w-12 mb-2"/>
                <p>No datasets uploaded yet. Upload your first dataset to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
