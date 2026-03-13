export const revalidate = 3600; // 1 hour — marketing pages change infrequently
import Link from "next/link";
import { ROUTES } from "@/lib/config/site";

export const metadata = {
  title: "Privacy Policy | Westbridge",
  description: "How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl bg-background px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground/60">Last updated: March 2026</p>

      <div className="mt-10 space-y-8 text-base text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. Who we are</h2>
          <p className="mt-2 leading-relaxed">
            Westbridge provides a business management platform. This Privacy Policy describes how we collect, use, and
            protect your information when you use our Service.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">2. Information we collect</h2>
          <p className="mt-2 leading-relaxed">
            We collect information you provide when you sign up (e.g. name, email, company name, country), payment and
            billing information processed by our payment provider (PowerTranz), and usage data necessary to operate the
            Service (e.g. login sessions, feature usage). We do not sell your personal data.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">3. How we use it</h2>
          <p className="mt-2 leading-relaxed">
            We use your information to provide and improve the Service, process payments, communicate with you about
            your account, comply with legal obligations, and protect the security of the Service. We may send you
            service-related emails (e.g. password reset, billing); you can opt out of marketing where offered.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">4. Data location and retention</h2>
          <p className="mt-2 leading-relaxed">
            Data is stored and processed in accordance with our infrastructure and partner agreements. We retain your
            data for as long as your account is active or as needed to provide the Service and comply with law. You may
            request access, correction, or deletion of your personal data by contacting us.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">5. Security</h2>
          <p className="mt-2 leading-relaxed">
            We use industry-standard measures to protect your data, including encryption in transit and access controls.
            Payment data is handled by our payment provider in accordance with applicable standards.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">6. Cookies and similar technologies</h2>
          <p className="mt-2 leading-relaxed">
            We use essential cookies and similar technologies to operate the Service (e.g. session management). You can
            control cookie settings in your browser; disabling essential cookies may affect the Service.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">7. Changes and contact</h2>
          <p className="mt-2 leading-relaxed">
            We may update this Privacy Policy from time to time; we will post the updated version and, where
            appropriate, notify you. Questions or requests regarding your data may be sent to the contact details on our
            website.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        <Link href={ROUTES.home} className="text-foreground transition-colors hover:opacity-100">
          Back to home
        </Link>
        {" · "}
        <Link href={ROUTES.terms} className="text-foreground transition-colors hover:opacity-100">
          Terms of Service
        </Link>
      </p>
    </div>
  );
}
