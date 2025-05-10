
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const pricingTiers = [
  {
    name: 'Basic',
    price: 'Free',
    description: 'Get started with essential smart home control.',
    features: [
      'Control up to 3 devices',
      'Basic routine automation',
      'Wake-up simulation',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/auth/signup',
    dataAiHint: 'price tag free'
  },
  {
    name: 'Pro',
    price: '$9.99',
    priceSuffix: '/ month',
    description: 'Unlock advanced features and unlimited devices.',
    features: [
      'Unlimited devices',
      'Advanced routine automation with AI suggestions',
      'Wristband integration & advanced analytics',
      'Priority email support',
      'Access to all soundscapes',
    ],
    cta: 'Choose Pro',
    href: '/auth/signup?plan=pro', // Example query param
    isPopular: true,
    dataAiHint: 'price tag premium'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Tailored solutions for businesses or advanced users.',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'API access',
      'On-premise options (future)',
    ],
    cta: 'Contact Sales',
    href: '/contact-sales', // Placeholder for a contact page
    dataAiHint: 'price tag enterprise'
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-grow py-12 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Find the Perfect Plan for <span className="text-primary">Your Smart Life</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits your needs and start experiencing smarter mornings with WakeSync.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {pricingTiers.map((tier) => (
              <Card key={tier.name} className={`flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ${tier.isPopular ? 'border-2 border-primary relative' : ''}`}>
                {tier.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full shadow-md">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center">
                   <div className="w-full h-40 bg-muted rounded-md mb-4 mx-auto flex items-center justify-center" data-ai-hint={tier.dataAiHint}>
                       <p className="text-muted-foreground text-sm">Visual for {tier.name} Plan</p>
                   </div>
                  <CardTitle className="text-3xl">{tier.name}</CardTitle>
                  <p className="text-4xl font-bold text-primary mt-2">
                    {tier.price}
                    {tier.priceSuffix && <span className="text-xl font-normal text-muted-foreground">{tier.priceSuffix}</span>}
                  </p>
                  <CardDescription className="mt-2 text-base">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" size="lg" variant={tier.isPopular ? 'default' : 'outline'}>
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-16 text-muted-foreground">
            <p>All plans come with a 14-day free trial for Pro features. No credit card required to start.</p>
            <p>Have questions? <Link href="/contact-us" className="text-primary hover:underline">Contact our support team</Link>.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
