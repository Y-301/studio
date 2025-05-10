
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-grow container mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
            <p>Welcome to WakeSync! We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at privacy@wakesync.example.com.</p>
            
            <h2 className="text-2xl font-semibold">1. Information We Collect (Placeholder)</h2>
            <p>As a demo application, WakeSync currently collects minimal user information required for authentication, such as your email address and chosen password (stored securely via Firebase Authentication). Display names are optional. For demonstration purposes, data generated within the app (e.g., mock device usage, routine configurations) is stored locally in your browser session or as mock data within the application code and is not transmitted to a persistent backend database beyond Firebase Authentication services.</p>
            
            <h2 className="text-2xl font-semibold">2. How We Use Your Information (Placeholder)</h2>
            <p>The information collected is solely for the purpose of demonstrating the application's features, including:
              <ul>
                <li>Authenticating your access to the dashboard.</li>
                <li>Allowing you to interact with the demo features like device management and routine creation.</li>
                <li>Personalizing your experience within the demo (e.g., theme preferences stored in localStorage).</li>
              </ul>
            </p>
            <p>No actual smart home device data is collected, nor is any data shared with third parties in this demo version.</p>

            <h2 className="text-2xl font-semibold">3. Data Storage & Security (Placeholder)</h2>
            <p>Authentication credentials (email, hashed passwords) are managed by Firebase Authentication, which employs industry-standard security measures. Other application data in this demo is either mock data or temporarily stored in your browser and is not persisted on our servers.</p>

            <h2 className="text-2xl font-semibold">4. Your Privacy Rights (Placeholder)</h2>
            <p>In a production version of WakeSync, you would have rights such as access, rectification, and erasure of your personal data. For this demo, as data is not persistently stored beyond authentication, these rights are contextually limited. You can delete your Firebase account through the settings page (demo functionality).</p>
            
            <h2 className="text-2xl font-semibold">5. Cookies and Tracking Technologies (Placeholder)</h2>
            <p>WakeSync uses essential cookies for Firebase Authentication session management. We use `localStorage` to store your theme preference. No third-party tracking cookies are used in this demo.</p>

            <h2 className="text-2xl font-semibold">6. Changes to This Privacy Notice</h2>
            <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.</p>

            <h2 className="text-2xl font-semibold">7. Contact Us</h2>
            <p>If you have questions or comments about this notice, you may email us at privacy@wakesync.example.com (this is a placeholder email).</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
