// app/terms/page.tsx
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-4">
          Last updated: October 29, 2025
        </p>

        <p className="mb-4">
          Welcome to Influencers CRM App (&quot;the App&quot;, &quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;). By accessing or using the App,
          you agree to be bound by these Terms of Service (&quot;Terms&quot;).
          If you do not agree to these Terms, please do not use the App.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          1. Acceptance of Terms
        </h2>
        <p className="mb-4">
          These Terms form a binding legal agreement between you and Influencers
          CRM App. By using the App, you represent that you are at least 18
          years old and capable of forming a binding contract.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          2. Description of Service
        </h2>
        <p className="mb-4">
          The App is a self-hosted CRM tool for managing influencer outreach,
          contracts, campaigns, and email automation using Google OAuth for
          Gmail integration. We reserve the right to modify or discontinue
          features at any time.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">3. User Accounts</h2>
        <p className="mb-4">
          To use the App, you must create an account with accurate information.
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activities under your account. Notify
          us immediately of any unauthorized use.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          4. Google Integration and OAuth
        </h2>
        <p className="mb-4">
          By connecting your Google account, you grant us permission to use the
          requested scopes (e.g., gmail.send, gmail.compose) solely for sending
          user-initiated emails. You must comply with Google&apos;s API terms
          and our Privacy Policy. We are not responsible for any issues arising
          from Google&apos;s services or your Gmail account.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          5. User Content and Conduct
        </h2>
        <p className="mb-4">
          You own your content (e.g., influencer data, emails), but grant us a
          limited license to use it for providing the App. Prohibited conduct
          includes:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Violating laws, spamming, or harassing others.</li>
          <li>
            Uploading malicious content or infringing intellectual property.
          </li>
          <li>Attempting to reverse-engineer or hack the App.</li>
        </ul>
        <p className="mb-4">
          We may remove content or terminate accounts for violations.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          6. Intellectual Property
        </h2>
        <p className="mb-4">
          The App, including code, design, and content, is our property or
          licensed to us. You receive a non-exclusive, revocable license to use
          the App for personal/business purposes. Do not copy, modify, or
          distribute without permission.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          7. Disclaimers and Limitation of Liability
        </h2>
        <p className="mb-4">
          The App is provided &quot;as is&quot; without warranties. We are not
          liable for indirect, incidental, or consequential damages, including
          data loss or business interruption. Our total liability shall not
          exceed $100.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">8. Indemnification</h2>
        <p className="mb-4">
          You agree to indemnify us against claims arising from your use of the
          App, violations of these Terms, or infringement of rights.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">9. Termination</h2>
        <p className="mb-4">
          We may terminate your access for any reason, including violations.
          Upon termination, cease all use and delete data.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">10. Governing Law</h2>
        <p className="mb-4">
          These Terms are governed by the laws of Azerbaijan, without regard to
          conflict of laws principles. Disputes shall be resolved in Baku
          courts.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          11. Changes to Terms
        </h2>
        <p className="mb-4">
          We may update these Terms - continued use constitutes acceptance.
          We&apos;ll notify via email for major changes.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">12. Contact Us</h2>
        <p className="mb-4">
          For questions, contact aliyevnariman98@gmail.com.
        </p>

        <Link href="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
