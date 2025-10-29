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
          By using Influencers CRM App (&quot;the App&quot;), you agree to these
          Terms of Service (&quot;Terms&quot;). If you do not agree, do not use
          the App.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">1. Use of the App</h2>
        <p className="mb-4">
          The App is a self-hosted CRM for influencer marketing. You may use it
          for lawful purposes only. Prohibited uses include:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Spamming, harassment, or illegal activities.</li>
          <li>
            Violating Google&apos;s API terms (e.g., misusing Gmail scopes).
          </li>
          <li>Attempting to hack or disrupt the App.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          2. Account and Security
        </h2>
        <p className="mb-4">
          You must provide accurate info during registration. Keep your password
          secure - you&apos;re responsible for account activity.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          3. Google Integration
        </h2>
        <p className="mb-4">
          By connecting Google, you authorize us to use specified scopes for
          email sending. You must comply with Google&apos;s terms. We don&apos;t
          access your emails beyond user-initiated actions.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          4. Intellectual Property
        </h2>
        <p className="mb-4">
          The App and its content are our property. You get a limited license to
          use it - don&apos;t copy or resell.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          5. Disclaimers and Limitations
        </h2>
        <p className="mb-4">
          The App is &apos;as is&apos; - no warranties. We&apos;re not liable
          for losses from use, including data loss or third - party actions
          (e.g., Google revoking access).
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">6. Termination</h2>
        <p className="mb-4">
          We can suspend/terminate your access for violations. Upon termination,
          delete all App data.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">
          7. Changes to Terms
        </h2>
        <p className="mb-4">
          We may update Terms - continued use means acceptance.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">8. Governing Law</h2>
        <p className="mb-4">These Terms are governed by Poland laws.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-4">9. Contact</h2>
        <p className="mb-4">Questions? Email aliyevnariman98@gmail.com.</p>

        <Link href="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
