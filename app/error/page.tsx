import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#252525] p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-red-500">Error</h1>
        <p className="mb-8 text-lg text-gray-300">{searchParams.message || "An unexpected error occurred"}</p>
        <Link href="/">
          <Button variant="default" size="lg">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

