import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#252525] via-[#252525] to-black p-4">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold text-red-500">Error</h1>
        <p className="text-lg text-gray-300">{searchParams.message || "An unexpected error occurred"}</p>
        <div className="flex justify-center gap-4">
          <Link href="/">
            <Button variant="default" size="lg">
              Return Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Try Again
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

