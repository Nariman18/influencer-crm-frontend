// app/page.tsx (or similar)
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-4">Influencers CRM App</h1>
      <p className="text-lg mb-6 text-center max-w-md">
        A self-hosted CRM for managing influencer outreach, contracts, and
        campaigns. Replace Excel workflows with automated emails, Instagram DM
        tools, and pipeline visualization.
      </p>
      <div className="space-x-4">
        <Link href="/auth/login">
          <button className="bg-red-500 text-white px-4 py-2 rounded">
            Login
          </button>
        </Link>
        <Link href="/auth/register">
          <button className="bg-black text-white px-4 py-2 rounded">
            Register
          </button>
        </Link>
      </div>
      <p className="mt-8 text-sm text-gray-600">
        For more info, see our{" "}
        <a href="/privacy" className="text-blue-600">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="/terms" className="text-blue-600">
          Terms of Service
        </a>
        .
      </p>
    </div>
  );
}
