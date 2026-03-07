export const revalidate = 3600; // 1 hour — marketing pages change infrequently
import Link from "next/link";
import { ROUTES } from "@/lib/config/site";

export const metadata = {
  title: "Terms of Service | Westbridge",
  description: "Terms of Service for Westbridge.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl bg-background px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground/60">Last updated: March 2026</p>

      <div className="mt-10 space-y-8 text-base text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. Agreement</h2>
          <p className="mt-2 leading-relaxed">
            By signing up for or using Westbridge (&quot;Service&quot;), you agree to these Terms of Service. Westbridge is a business management platform. If you are using the Service on behalf of a company, you represent that you have authority to bind that company.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">2. Use of the Service</h2>
          <p className="mt-2 leading-relaxed">
            You will use the Service only for lawful business purposes. You are responsible for maintaining the security of your account and for all activity under your account. You will not attempt to gain unauthorized access to the Service, other accounts, or our systems.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">3. Payment and Subscription</h2>
          <p className="mt-2 leading-relaxed">
            Subscription fees are billed in advance according to your selected plan. Payment is processed via 2Checkout (Verifone). Refunds are handled in accordance with our refund policy and applicable law. We may change pricing with reasonable notice; continued use after changes constitutes acceptance.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">4. Data and Privacy</h2>
          <p className="mt-2 leading-relaxed">
            Your use of the Service is also governed by our <Link href={ROUTES.privacy} className="underline text-foreground">Privacy Policy</Link>. We process data as necessary to provide the Service and as described in the Privacy Policy.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">5. Termination</h2>
          <p className="mt-2 leading-relaxed">
            You may cancel your subscription at any time. We may suspend or terminate your access for breach of these Terms, non-payment, or for operational or legal reasons, with notice where practicable.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">6. Limitation of Liability</h2>
          <p className="mt-2 leading-relaxed">
            To the maximum extent permitted by law, Westbridge and its providers shall not be liable for indirect, incidental, special, or consequential damages, or for loss of data or business interruption arising from your use of the Service.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">7. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions about these Terms may be sent to the contact details provided on our website.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-muted-foreground/60">
        <Link href={ROUTES.home} className="text-foreground transition-colors hover:opacity-100">Back to home</Link>
      </p>
    </div>
  );
}
