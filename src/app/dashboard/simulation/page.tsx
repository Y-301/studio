import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WakeUpSimulator } from "@/components/simulation/WakeUpSimulator";
import { SlidersHorizontal, Zap, House } from "lucide-react";

export default function SimulationPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">House & Wake-Up Simulation</h1>
          <p className="text-muted-foreground">
            Test and configure your smart wake-up experience and home automation scenarios.
          </p>
        </div>
         {/* Image removed */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            Wake-Up Simulation
          </CardTitle>
          <CardDescription>
            Fine-tune your gentle wake-up settings. Adjust light intensity, soundscapes, and duration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WakeUpSimulator />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <House className="h-6 w-6 text-primary" />
            Full House Simulation
          </CardTitle>
          <CardDescription>
            Simulate different scenarios (e.g., "Leaving Home", "Movie Night") to test your routines and device interactions.
            This feature is under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg">Full House Simulation controls coming soon!</p>
            <p className="text-sm">Imagine testing entire routines with a single click.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
