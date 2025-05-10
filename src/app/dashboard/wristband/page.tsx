import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Watch, Activity, BatteryFull, Wifi, LinkIcon } from "lucide-react";

export default function WristbandPage() {
  const wristbandConnected = true; // Mock status

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wristband Management</h1>
          <p className="text-muted-foreground">
            Connect and manage your WakeSync compatible wristband.
          </p>
        </div>
        {/* Image removed */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="h-6 w-6 text-primary" />
            {wristbandConnected ? "WakeSync Band X1" : "No Wristband Connected"}
          </CardTitle>
          <CardDescription>
            {wristbandConnected
              ? "Your wristband is connected and syncing data."
              : "Connect your wristband to track sleep, activity, and enhance your wake-up experience."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wristbandConnected ? (
            <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                    <Card className="p-4">
                        <BatteryFull className="h-8 w-8 mx-auto text-green-500 mb-2"/>
                        <p className="font-semibold">Battery</p>
                        <p className="text-lg">87%</p>
                    </Card>
                     <Card className="p-4">
                        <Activity className="h-8 w-8 mx-auto text-blue-500 mb-2"/>
                        <p className="font-semibold">Last Sync</p>
                        <p className="text-lg">2 mins ago</p>
                    </Card>
                     <Card className="p-4">
                        <Wifi className="h-8 w-8 mx-auto text-primary mb-2"/>
                        <p className="font-semibold">Connection</p>
                        <p className="text-lg">Bluetooth LE</p>
                    </Card>
                </div>
              {/* Image removed */}
              <div className="flex gap-4">
                <Button>View Detailed Stats</Button>
                <Button variant="outline">Sync Now</Button>
                <Button variant="destructive">Disconnect Wristband</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">Connect Your Wristband</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow the instructions in your wristband&apos;s manual to pair it with WakeSync.
              </p>
              <Button className="mt-6">
                <Wifi className="mr-2 h-4 w-4" /> Connect Wristband
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Compatible Wristbands</CardTitle>
            <CardDescription>WakeSync supports a growing range of smart wristbands and wearables.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>WakeSync Band X1 (Recommended)</li>
                <li>Fitbit Versa Series & Sense Series</li>
                <li>Apple Watch (via HealthKit integration)</li>
                <li>Garmin Vivosmart & Forerunner Series</li>
            </ul>
            <p className="text-xs mt-4">*Feature availability may vary by device.</p>
        </CardContent>
      </Card>
    </div>
  );
}
