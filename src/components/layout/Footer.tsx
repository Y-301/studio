import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t py-8 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Logo iconSize={20} textSize="text-xl" />
            <p className="text-muted-foreground mt-1 text-sm">
              Your personal wake-up and smart home assistant.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} WakeSync. All rights reserved.</p>
            <p>
              <a href="/privacy" className="hover:text-primary">Privacy Policy</a> | 
              <a href="/terms" className="hover:text-primary"> Terms of Service</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
