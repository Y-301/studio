import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListChecks, Sun, Moon, Zap } from "lucide-react";
import Link from "next/link";
import { RoutineSuggestionClient } from "@/components/routines/RoutineSuggestionClient";
import Image from "next/image";

// Mock routines data
const routines = [
  { id: "1", name: "Morning Energizer", description: "Wake up lights, coffee machine on, morning news.", icon: Sun, active: true, dataAiHint: "morning sun" },
  { id: "2", name: "Evening Wind-Down", description: "Dim lights, relaxing music, lock doors.", icon: Moon, active: false, dataAiHint: "night moon" },
  { id: "3", name: "Workout Mode", description: "Cool down room, energizing playlist, track workout.", icon: Zap, active: false, dataAiHint: "fitness gym" },
];

export default function RoutinesPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Routines</h1>
          <p className="text-muted-foreground">
            Automate your day with personalized routines.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Routine
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>AI Routine Suggester</CardTitle>
          <CardDescription>Let WakeSync AI help you craft the perfect routine based on your day.</CardDescription>
        </CardHeader>
        <CardContent>
          <RoutineSuggestionClient />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Routines</CardTitle>
          <CardDescription>Manage your existing routines or create new ones.</CardDescription>
        </CardHeader>
        <CardContent>
          {routines.length > 0 ? (
            <div className="space-y-4">
              {routines.map((routine) => (
                <Card key={routine.id} className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <routine.icon className={`h-8 w-8 ${routine.active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Image 
                        src={`https://picsum.photos/seed/routine${routine.id}/100/100`}
                        alt={routine.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover aspect-square"
                        data-ai-hint={routine.dataAiHint}
                    />
                    <div>
                      <h3 className="font-semibold">{routine.name}</h3>
                      <p className="text-sm text-muted-foreground">{routine.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant={routine.active ? "default" : "outline"} size="sm">
                      {routine.active ? "Active" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Routines Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first routine to automate your tasks.
              </p>
              <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Routine
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
