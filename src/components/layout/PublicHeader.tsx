
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <div className="flex items-center gap-x-2 sm:gap-x-4">
          <nav className="hidden sm:flex items-center gap-x-2 md:gap-x-4">
            <Button variant="ghost" asChild>
              <Link href="/features">Features</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/learn-more">Learn More</Link>
            </Button>
          </nav>
          <ThemeToggle />
          <div className="flex items-center gap-x-2">
            <Button asChild size="sm">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

