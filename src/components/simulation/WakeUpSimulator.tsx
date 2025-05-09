"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, PauseCircle, RotateCcw, Sun, Volume2, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function WakeUpSimulator() {
  const [duration, setDuration] = useState(30); // minutes
  const [lightIntensity, setLightIntensity] = useState(50); // percentage
  const [soundscape, setSoundscape] = useState("nature_sounds");
  const [volume, setVolume] = useState(40); // percentage
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0); // percentage of simulation completed
  const [elapsedTime, setElapsedTime] = useState(0); // seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && duration > 0) {
      const totalSeconds = duration * 60;
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const nextTime = prev + 1;
          if (nextTime >= totalSeconds) {
            clearInterval(interval);
            setIsRunning(false);
            setProgress(100);
            return totalSeconds;
          }
          setProgress((nextTime / totalSeconds) * 100);
          return nextTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, duration]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setElapsedTime(0);
      setProgress(0);
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setProgress(0);
    // Optionally reset all settings to default
    // setDuration(30);
    // setLightIntensity(50);
    // setSoundscape("nature_sounds");
    // setVolume(40);
  };
  
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };


  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Duration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="duration">Wake-up Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value)))}
              min="1"
              max="120"
            />
            <Slider
              value={[duration]}
              onValueChange={(value) => setDuration(value[0])}
              max={120}
              step={1}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5"/>Light Intensity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="light-intensity">Max Light Intensity (%)</Label>
            <Input
              id="light-intensity"
              type="number"
              value={lightIntensity}
              onChange={(e) => setLightIntensity(Math.max(0, Math.min(100, parseInt(e.target.value))))}
              min="0"
              max="100"
            />
            <Slider
              value={[lightIntensity]}
              onValueChange={(value) => setLightIntensity(value[0])}
              max={100}
              step={1}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Soundscape</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="soundscape">Choose Soundscape</Label>
            <Select value={soundscape} onValueChange={setSoundscape}>
              <SelectTrigger id="soundscape">
                <SelectValue placeholder="Select a soundscape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nature_sounds">Nature Sounds</SelectItem>
                <SelectItem value="gentle_flute">Gentle Flute</SelectItem>
                <SelectItem value="ocean_waves">Ocean Waves</SelectItem>
                <SelectItem value="birds_chirping">Birds Chirping</SelectItem>
                <SelectItem value="custom_playlist">Custom Playlist (via Spotify)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Volume2 className="h-5 w-5"/>Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="volume">Max Volume (%)</Label>
             <Input
              id="volume"
              type="number"
              value={volume}
              onChange={(e) => setVolume(Math.max(0, Math.min(100, parseInt(e.target.value))))}
              min="0"
              max="100"
            />
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={100}
              step={1}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8 p-6 bg-secondary/50">
        <CardTitle className="text-xl mb-4">Simulation Preview</CardTitle>
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Simulated Time Elapsed</p>
                <p className="text-4xl font-bold text-primary">{formatTime(elapsedTime)} / {formatTime(duration*60)}</p>
            </div>
            <Progress value={progress} className="w-full h-4" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Light: {isRunning ? Math.round(lightIntensity * (progress/100)) : 0}%</span>
                <span>Volume: {isRunning ? Math.round(volume * (progress/100)) : 0}%</span>
            </div>
             <div className="flex justify-center items-center space-x-4 pt-4">
                <Button onClick={handleStartStop} size="lg" className="w-36">
                {isRunning ? <PauseCircle className="mr-2 h-5 w-5" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                {isRunning ? "Pause Sim" : "Start Sim"}
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
}
