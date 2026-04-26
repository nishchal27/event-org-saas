import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Lexnify",
  description: "Privacy Policy for Lexnify SaaS platform",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="March 2026">
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          1. Information We Collect
        </h2>
        <p>
          We collect information such as name, email, and authentication data
          when you create an account. You may also provide event and attendee
          data such as phone numbers and event details.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          2. How We Use Information
        </h2>
        <p>
          We use your data to operate Lexnify, manage events, improve user
          experience, and maintain platform security.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          3. Third-Party Services
        </h2>
        <p>
          We use trusted providers such as Clerk (authentication), Stripe
          (payments), and Twilio (messaging infrastructure). These services
          process only necessary data.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          4. Messaging Clarification
        </h2>
        <p>
          Lexnify does not access personal WhatsApp accounts. Any sharing is
          done through external links or third-party messaging services.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          5. Data Ownership
        </h2>
        <p>
          You retain ownership of your data. We do not sell or rent your
          information.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          6. Data Security
        </h2>
        <p>
          We implement security measures including encrypted connections and
          access controls. However, no system is completely secure.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          7. Data Retention
        </h2>
        <p>
          Data is retained as long as your account is active or required for
          operational and legal purposes.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-2">
          8. Your Rights
        </h2>
        <p>
          You may request access, correction, or deletion of your data by
          contacting us.
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