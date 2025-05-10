
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Watch, Sunrise, ListChecks, Smartphone, Waypoints, BarChart3, FileText, SettingsIcon, BrainCircuit, LinkIcon, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const detailedFeatures = [
  {
    icon: <Watch className="h-12 w-12 text-primary" />,
    title: 'Seamless Wristband Integration',
    description: 'Connect your favorite smart wristband to WakeSync. Track sleep cycles, heart rate, and activity levels to enable intelligent automation and personalized wake-up experiences. Your wristband data powers smarter routines and provides deeper insights into your well-being.',
    dataAiHint: 'smartwatch connection',
    category: 'Core Technology'
  },
  {
    icon: <Sunrise className="h-12 w-12 text-primary" />,
    title: 'Intelligent Smart Wake-Up',
    description: 'Experience a natural and gentle wake-up process. WakeSync simulates a gradual sunrise by controlling your smart lights, complemented by customizable soundscapes that gently bring you out of sleep. Set preferences for duration, light intensity, and sound themes.',
    dataAiHint: 'sunrise alarm clock',
    category: 'Wake-Up Experience'
  },
  {
    icon: <ListChecks className="h-12 w-12 text-primary" />,
    title: 'Powerful Custom Routines',
    description: 'Automate your life with highly customizable routines. Trigger sequences of actions based on time of day, specific events from your wristband (like waking up), or manual activation. Control multiple devices, set scenes, and streamline your daily tasks effortlessly.',
    dataAiHint: 'automation tasks',
    category: 'Automation'
  },
  {
    icon: <Smartphone className="h-12 w-12 text-primary" />,
    title: 'Comprehensive Device Management',
    description: 'A centralized hub to manage all your connected smart home devices. View status, control settings (on/off, brightness, temperature), and organize devices by room or type. Add new devices with ease and keep an overview of your entire smart ecosystem.',
    dataAiHint: 'smart home control',
    category: 'Device Control'
  },
  {
    icon: <Waypoints className="h-12 w-12 text-primary" />,
    title: 'Interactive House Simulation',
    description: 'Visualize your home layout and device placements. The simulation allows you to test routines, see device interactions, and manage your home environment graphically. (Future: Drag-and-drop device placement and room creation).',
    dataAiHint: 'home layout',
    category: 'Visualization & Control'
  },
  {
    icon: <BarChart3 className="h-12 w-12 text-primary" />,
    title: 'In-Depth Analytics',
    description: 'Gain valuable insights into your sleep patterns, activity levels, smart home usage, and energy consumption. Understand your habits better with clear charts and data summaries, helping you optimize your routines and lifestyle.',
    dataAiHint: 'data charts graphs',
    category: 'Insights & Data'
  },
   {
    icon: <FileText className="h-12 w-12 text-primary" />,
    title: 'Detailed Event Logs',
    description: 'Keep track of all system activities and device events. Filter logs by type, severity, or source to troubleshoot issues or review historical actions within your smart home.',
    dataAiHint: 'system logs events',
    category: 'Monitoring'
  },
  {
    icon: <SettingsIcon className="h-12 w-12 text-primary" />,
    title: 'Personalized Settings',
    description: 'Customize your WakeSync experience. Manage your account, configure notification preferences, adjust device synchronization options, and set appearance preferences including light/dark themes.',
    dataAiHint: 'user preferences',
    category: 'Customization'
  },
  {
    icon: <BrainCircuit className="h-12 w-12 text-primary" />,
    title: 'AI-Powered Suggestions (Genkit)',
    description: 'Leverage the power of AI with Genkit integration. Get intelligent routine suggestions based on your calendar, weather, and stated preferences, making your automation smarter and more adaptive.',
    dataAiHint: 'artificial intelligence',
    category: 'Automation'
  },
  {
    icon: <LinkIcon className="h-12 w-12 text-primary" />,
    title: 'Third-Party Integrations',
    description: 'Connect WakeSync with other services you love. (Planned: Google Fit, Apple Health, Spotify) to enrich your data and expand automation possibilities.',
    dataAiHint: 'api connections',
    category: 'Connectivity'
  },
  {
    icon: <Users className="h-12 w-12 text-primary" />,
    title: 'Multi-User Support (Planned)',
    description: 'Allow multiple family members to have their own profiles, preferences, and routines within the same WakeSync household.',
    dataAiHint: 'family accounts',
    category: 'Customization'
  }
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-grow py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Discover the Power of <span className="text-primary">WakeSync</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              WakeSync is more than just a smart home app. It's your personal assistant for better mornings, optimized routines, and an intelligently connected home. Explore the features that make WakeSync unique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {detailedFeatures.map((feature) => (
              <Card key={feature.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-3">
                    {feature.icon}
                    <CardTitle className="text-2xl leading-tight">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-primary font-semibold uppercase tracking-wider">{feature.category}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="w-full h-40 bg-muted rounded-md mb-4 mx-auto flex items-center justify-center" data-ai-hint={feature.dataAiHint}>
                       <p className="text-muted-foreground text-sm p-2 text-center">Visual for: {feature.title}</p>
                  </div>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/auth/signup">Get Started with WakeSync</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
