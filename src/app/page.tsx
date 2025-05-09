import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Smartphone, Brain, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    icon: <Clock className="h-10 w-10 text-primary" />,
    title: 'Wake Up Simulation',
    description: 'Gently wake up with simulated sunrises and customizable soundscapes.',
    img: "https://picsum.photos/seed/wakeup/400/300",
    aiHint: "sunrise alarm"
  },
  {
    icon: <Smartphone className="h-10 w-10 text-primary" />,
    title: 'Smart Home Control',
    description: 'Seamlessly control all your IoT devices from a single, intuitive interface.',
    img: "https://picsum.photos/seed/smarthome/400/300",
    aiHint: "smart home"
  },
  {
    icon: <Brain className="h-10 w-10 text-primary" />,
    title: 'AI Routine Suggestions',
    description: 'Let our AI craft the perfect morning routine based on your schedule and preferences.',
    img: "https://picsum.photos/seed/ai/400/300",
    aiHint: "artificial intelligence"
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Revolutionize Your Mornings with <span className="text-primary">WakeSync</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              WakeSync intelligently blends smart alarm features with home automation to create your perfect start to the day.
            </p>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/auth/signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Explore Dashboard</Link>
              </Button>
            </div>
             <div className="mt-16">
                <Image 
                    src="https://picsum.photos/seed/hero/1200/600" 
                    alt="WakeSync Dashboard Preview" 
                    width={1200} 
                    height={600} 
                    className="rounded-lg shadow-2xl mx-auto"
                    data-ai-hint="dashboard interface"
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
              Everything You Need for a Smarter Morning
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4 text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-center">
                    <Image 
                        src={feature.img}
                        alt={feature.title}
                        width={400}
                        height={300}
                        className="rounded-md mb-4 aspect-[4/3] object-cover"
                        data-ai-hint={feature.aiHint}
                    />
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
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
