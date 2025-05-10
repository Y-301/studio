
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-8 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} WakeSync. All rights reserved.</p>
          <p>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link> | 
            <Link href="/terms" className="hover:text-primary"> Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
