import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service | Lexnify",
  description: "Terms of Service for Lexnify SaaS platform",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="March 2026">
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          1. Use of Service
        </h2>
        <p>
          Lexnify provides tools for event creation, attendee management, and
          check-in workflows. You agree to use the service lawfully.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          2. User Responsibilities
        </h2>
        <p>
          You are responsible for the data you upload and must ensure compliance
          with applicable laws. You must not use the platform for spam or abuse.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          3. Accounts
        </h2>
        <p>
          You are responsible for maintaining account security. We may suspend
          accounts that violate these terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          4. Messaging
        </h2>
        <p>
          Communication features rely on third-party services. You are
          responsible for how you contact users.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          5. Third-Party Services
        </h2>
        <p>
          We are not responsible for issues caused by third-party services such
          as authentication, payments, or messaging providers.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          6. Data
        </h2>
        <p>
          You retain ownership of your data but grant us permission to process
          it to provide the service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          7. Service Availability
        </h2>
        <p>
          We do not guarantee uninterrupted service. Features may change over
          time.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          8. Limitation of Liability
        </h2>
        <p>
          Lexnify is not liable for data loss, business loss, or indirect
          damages.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          9. Contact
        </h2>
        <p>Email: nishchal27dev@gmail.com</p>
      </section>
    </LegalLayout>
  );
}