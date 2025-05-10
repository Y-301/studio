import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Watch, Sunrise, ListChecks } from 'lucide-react'; // Changed icons to match report context
import Link from 'next/link';

const features = [
  {
    icon: <Watch className="h-10 w-10 text-primary" />,
    title: 'Wristband Integration',
    description: 'Connect your smart wristband for seamless health tracking and enhanced automation.',
    dataAiHint: 'smartwatch health'
  },
  {
    icon: <Sunrise className="h-10 w-10 text-primary" />,
    title: 'Smart Wake-Up',
    description: 'Gently wake up with simulated sunrises and customizable soundscapes, fully integrated with your home.',
    dataAiHint: 'sunrise alarm'
  },
  {
    icon: <ListChecks className="h-10 w-10 text-primary" />,
    title: 'Custom Routines',
    description: 'Create personalized routines that automate your smart devices based on time, events, or wristband data.',
    dataAiHint: 'automation checklist'
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section 
          className="py-20 md:py-32 bg-gradient-to-br from-primary/20 via-background to-background/80" // Adjusted hero gradient
          style={{ '--hero-gradient-start': 'hsl(var(--primary) / 0.2)', '--hero-gradient-end': 'hsl(var(--background))' } as React.CSSProperties}
        >
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Smarter Mornings, Simplified Living with <span className="text-primary">WakeSync</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              WakeSync seamlessly integrates your smart wristband and home devices for an unparalleled automated experience.
            </p>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Try Demo Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#features">Learn More</Link>
              </Button>
            </div>
            <div className="mt-16">
              <img src="https://picsum.photos/seed/dashboard-showcase/800/450" alt="WakeSync Dashboard Showcase" className="rounded-lg shadow-xl mx-auto" data-ai-hint="dashboard interface" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
              Elevate Your Day with Intelligent Automation
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
                  <CardHeader className="items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4 text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-center">
                    <img src={`https://picsum.photos/seed/${feature.title.toLowerCase().replace(/\s+/g, '-')}/300/200`} alt={feature.title} className="rounded-md mb-4 mx-auto" data-ai-hint={feature.dataAiHint}/>
                    <CardDescription className="text-base mt-4">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section - Retained from previous, still relevant */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
              Simple Steps to a Perfect Morning
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground rounded-full p-4 mb-4 text-2xl font-bold w-16 h-16 flex items-center justify-center">1</div>
                <h3 className="text-xl font-semibold mb-2">Connect Devices</h3>
                <p className="text-muted-foreground">Easily link your smart home gadgets and wearables.</p>
              </div>
              <div className="flex flex-col items-center">
                 <div className="bg-primary text-primary-foreground rounded-full p-4 mb-4 text-2xl font-bold w-16 h-16 flex items-center justify-center">2</div>
                <h3 className="text-xl font-semibold mb-2">Set Preferences</h3>
                <p className="text-muted-foreground">Tell WakeSync about your ideal morning and daily schedule.</p>
              </div>
              <div className="flex flex-col items-center">
                 <div className="bg-primary text-primary-foreground rounded-full p-4 mb-4 text-2xl font-bold w-16 h-16 flex items-center justify-center">3</div>
                <h3 className="text-xl font-semibold mb-2">Wake Up Refreshed</h3>
                <p className="text-muted-foreground">Enjoy AI-powered routines and automated home adjustments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Mornings?</h2>
            <p className="text-lg md:text-xl opacity-90 mb-10 max-w-xl mx-auto">
              Join thousands of users who start their day smarter with WakeSync.
            </p>
            <Button size="lg" variant="secondary" asChild className="bg-background text-primary hover:bg-background/90">
              <Link href="/auth/signup">Sign Up Now & Sleep Better</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
