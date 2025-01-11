import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { verifyAddress, getSuggestedAddresses, VerifiedAddress } from '@/lib/googleMaps'

interface AddressInputProps {
  onSubmit: (addressData: VerifiedAddress) => void;
}

export default function AddressInput({ onSubmit }: AddressInputProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>()

  const handleInputChange = async (value: string) => {
    setInput(value)
    setError('')

    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current)
    }

    if (value.trim().length > 2) {
      suggestionTimeoutRef.current = setTimeout(async () => {
        try {
          const addresses = await getSuggestedAddresses(value)
          setSuggestions(addresses)
          setShowSuggestions(addresses.length > 0)
        } catch (err) {
          console.error('Failed to get suggestions:', err)
          setSuggestions([])
          setShowSuggestions(false)
        }
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (address: string) => {
    setInput(address)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const verifiedAddress = await verifyAddress(input)
      console.log('Verified address:', verifiedAddress) // For debugging
      onSubmit(verifiedAddress)
    } catch (err: any) {
      setError(err.message || 'Failed to verify address')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center bg-white rounded-full shadow-lg overflow-hidden">
          <input
            type="text"
            placeholder="Enter your address"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 px-6 py-4 text-gray-900 text-lg outline-none"
            autoComplete="off"
          />
          <Button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="m-1 rounded-full px-8 h-12 bg-[#0047FF] hover:bg-[#0040E5] text-white font-semibold"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Get started'
            )}
          </Button>
        </div>
      </form>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl">
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-2 text-red-500 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  )
}