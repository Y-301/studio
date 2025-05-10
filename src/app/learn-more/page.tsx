
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Users, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LearnMorePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-grow py-12 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Dive Deeper into <span className="text-primary">WakeSync</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Understand our mission, how WakeSync works, and what makes our approach to smart living unique.
            </p>
          </section>

          <section className="mb-16">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-8 w-8 text-primary"/>
                    <CardTitle className="text-3xl">Our Mission: Smarter Living, Simplified</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-lg text-muted-foreground space-y-4">
                <p>At WakeSync, we believe that technology should simplify your life, not complicate it. Our mission is to create a seamless and intuitive smart home experience that starts with the most important part of your day: waking up.</p>
                <p>We aim to empower you with tools that automate mundane tasks, provide valuable insights into your well-being, and create a comfortable, responsive home environment. We're passionate about integrating cutting-edge AI with user-friendly design to deliver a product that truly enhances your daily routine.</p>
                 <div className="w-full h-56 bg-muted rounded-md my-6 mx-auto flex items-center justify-center" data-ai-hint="team working collaboration">
                    <p className="text-muted-foreground text-sm p-2 text-center">Visual: Team collaborating on WakeSync</p>
                 </div>
              </CardContent>
            </Card>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-10">How WakeSync Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader><CardTitle>1. Connect</CardTitle></CardHeader>
                <CardContent>
                    <div className="w-full h-32 bg-muted rounded-md mb-3 mx-auto flex items-center justify-center" data-ai-hint="devices connecting network">
                        <p className="text-muted-foreground text-xs p-1 text-center">Connect Devices</p>
                    </div>
                    <p className="text-muted-foreground">Easily link your smart wristbands, lights, thermostats, speakers, and other compatible devices to the WakeSync platform through our intuitive interface.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>2. Personalize</CardTitle></CardHeader>
                <CardContent>
                    <div className="w-full h-32 bg-muted rounded-md mb-3 mx-auto flex items-center justify-center" data-ai-hint="settings configuration user">
                        <p className="text-muted-foreground text-xs p-1 text-center">Personalize Settings</p>
                    </div>
                    <p className="text-muted-foreground">Customize your wake-up simulations, create powerful routines, and set your preferences. Tell WakeSync how you want your smart home to behave.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>3. Automate & Analyze</CardTitle></CardHeader>
                <CardContent>
                    <div className="w-full h-32 bg-muted rounded-md mb-3 mx-auto flex items-center justify-center" data-ai-hint="charts graphs ai">
                         <p className="text-muted-foreground text-xs p-1 text-center">Automate & Analyze</p>
                    </div>
                    <p className="text-muted-foreground">Let WakeSync's AI manage your routines and provide insights from your data. Enjoy automated adjustments and understand your patterns for a better lifestyle.</p>
                </CardContent>
              </Card>
            </div>
          </section>
          
          <section className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3"> <Users className="h-7 w-7 text-primary"/> <CardTitle>Who is WakeSync For?</CardTitle></div>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-2">
                    <p><strong>Tech Enthusiasts:</strong> Dive deep into automation and control every aspect of your smart home.</p>
                    <p><strong>Busy Professionals:</strong> Streamline your mornings and evenings to save time and reduce stress.</p>
                    <p><strong>Health Conscious Individuals:</strong> Leverage wristband data for better sleep and activity tracking insights.</p>
                    <p><strong>Anyone Seeking Convenience:</strong> Enjoy a home that adapts to your needs without complex setups.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3"> <ShieldCheck className="h-7 w-7 text-primary"/> <CardTitle>Our Commitment to Privacy</CardTitle></div>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-2">
                    <p>We understand that your home and personal data are sensitive. WakeSync is designed with privacy at its core. We are committed to:</p>
                    <ul className="list-disc list-inside ml-4">
                        <li>Transparent data usage policies.</li>
                        <li>Secure data handling and storage.</li>
                        <li>Giving you control over your information.</li>
                    </ul>
                    <p className="mt-2">Read our full <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.</p>
                </CardContent>
            </Card>
          </section>

          <section className="text-center">
            <div className="flex items-center gap-3 justify-center mb-2"> <HelpCircle className="h-7 w-7 text-primary"/> <h2 className="text-3xl font-semibold text-foreground">Have More Questions?</h2></div>
            <p className="text-lg text-muted-foreground mb-6">We're here to help. Explore our features or get in touch with our team.</p>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/features">Explore Features</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact-us">Contact Us</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
