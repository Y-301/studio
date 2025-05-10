
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-grow container mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
            <p>Welcome to WakeSync! These Terms of Service ("Terms") govern your use of the WakeSync application and services (collectively, the "Service"), provided as a demonstration application.</p>
            
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms (Placeholder)</h2>
            <p>By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service. This is a demo application, and use is for evaluation purposes only.</p>
            
            <h2 className="text-2xl font-semibold">2. Use of Service (Placeholder)</h2>
            <p>WakeSync grants you a non-exclusive, non-transferable, revocable license to use the Service strictly for personal, non-commercial demonstration purposes, subject to these Terms.</p>
            <p>You agree not to:
              <ul>
                <li>Use the Service for any illegal or unauthorized purpose.</li>
                <li>Attempt to reverse engineer or hack the Service.</li>
                <li>Introduce any viruses, trojan horses, worms, or other malicious material.</li>
              </ul>
            </p>

            <h2 className="text-2xl font-semibold">3. Accounts (Placeholder)</h2>
            <p>When you create an account with us (via Firebase Authentication for this demo), you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service (demo functionality).</p>
            <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>

            <h2 className="text-2xl font-semibold">4. Intellectual Property (Placeholder)</h2>
            <p>The Service and its original content (excluding content provided by users, which is mock data in this demo), features, and functionality are and will remain the exclusive property of WakeSync and its licensors. This demo application itself is a showcase of potential features.</p>
            
            <h2 className="text-2xl font-semibold">5. Disclaimer of Warranties; Limitation of Liability (Placeholder)</h2>
            <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WAKESYNC MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS AND NEGATES ALL OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OF INTELLECTUAL PROPERTY OR OTHER VIOLATION OF RIGHTS.</p>
            <p>In no event shall WakeSync or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service, even if WakeSync or a WakeSync authorized representative has been notified orally or in writing of the possibility of such damage. BECAUSE THIS IS A DEMO APPLICATION, IT IS NOT INTENDED FOR CRITICAL USE.</p>

            <h2 className="text-2xl font-semibold">6. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>

            <h2 className="text-2xl font-semibold">7. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at terms@wakesync.example.com (this is a placeholder email).</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
