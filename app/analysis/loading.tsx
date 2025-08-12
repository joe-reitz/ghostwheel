import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="text-white">Loading analysis...</span>
      </div>
    </div>
  )
}
