"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { createOrder, getCurrentUserProfile } from "@/lib/api"

const plans = [
  {
    id: "basic_100gb",
    name: "Basic",
    storageGb: 100,
    desc: "Backups for personal projects",
    monthly: 9900,
    yearly: 99900,
    monthlyDisplay: "₹99",
    yearlyDisplay: "₹999",
  },
  {
    id: "pro_500gb",
    name: "Pro",
    storageGb: 500,
    desc: "For professionals and small teams",
    monthly: 19900,
    yearly: 199900,
    monthlyDisplay: "₹199",
    yearlyDisplay: "₹1,999",
    popular: true,
  },
  {
    id: "business_2tb",
    name: "Business",
    storageGb: 2000,
    desc: "For businesses with large datasets",
    monthly: 44900,
    yearly: 449900,
    monthlyDisplay: "₹449",
    yearlyDisplay: "₹4,499",
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>("free")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [upgradedPlan, setUpgradedPlan] = useState("")
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    getCurrentUserProfile()
      .then((user) => setCurrentPlan(user.plan || "free"))
      .catch(() => {})
      .finally(() => setPageLoading(false))
  }, [])

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    setError("")
    setSuccess("")

    try {
      const order = await createOrder(planId, yearly ? "yearly" : "monthly")

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "LongBackup",
        description: `${order.planName} Plan (${yearly ? "Yearly" : "Monthly"})`,
        order_id: order.orderId,
        prefill: {},
        theme: { color: "#2563eb" },
        handler: async function (response: any) {
          try {
            const { verifyPayment } = await import("@/lib/api")
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              interval: yearly ? "yearly" : "monthly",
            })
            setUpgradedPlan(planId)
            setShowSuccessOverlay(true)
            setTimeout(() => {
              setShowSuccessOverlay(false)
              router.push("/dashboard/settings")
            }, 3000)
          } catch {
            setError("Payment verification failed. Please contact support.")
          }
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      setError(err?.message || "Failed to create order")
    } finally {
      setLoading(null)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-10" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Pricing</h1>
        <p className="text-center text-gray-500 mb-8">
          Choose the plan that fits your needs
        </p>

        {currentPlan !== "free" && (
          <div className="text-center mb-8 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            You are currently on the <strong>{plans.find(p => p.id === currentPlan)?.name || "Pro"}</strong> plan.
          </div>
        )}

        <div className="flex justify-center items-center gap-3 mb-10">
          <span className={`text-sm ${!yearly ? "font-semibold text-gray-900" : "text-gray-500"}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${yearly ? "translate-x-6" : ""}`}
            />
          </button>
          <span className={`text-sm ${yearly ? "font-semibold text-gray-900" : "text-gray-500"}`}>
            Yearly <span className="text-green-600 text-xs font-medium">Save ~17%</span>
          </span>
        </div>

        {error && <p className="text-center text-red-600 text-sm mb-4">{error}</p>}
        {success && <p className="text-center text-green-600 text-sm mb-4">{success}</p>}

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const priceDisplay = yearly ? plan.yearlyDisplay : plan.monthlyDisplay
            const periodDisplay = yearly ? "/yr" : "/mo"

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border shadow-sm p-6 flex flex-col relative ${
                  plan.popular ? "ring-2 ring-blue-500" : ""
                } ${isCurrent ? "opacity-75" : ""}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>

                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold">{priceDisplay}</span>
                  <span className="text-gray-500 text-sm">{periodDisplay}</span>
                </div>

                <ul className="space-y-2 text-sm mb-6 flex-1">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {plan.storageGb} GB storage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Deep Archive storage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Email notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 48h download links
                  </li>
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2 px-4 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading !== null}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-white ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-800 hover:bg-gray-900"
                    } disabled:opacity-50`}
                  >
                    {loading === plan.id ? "Processing..." : "Subscribe"}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      </div>

      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-1">
              Welcome to <strong>{plans.find(p => p.id === upgradedPlan)?.name || ""}</strong> Plan
            </p>
            <p className="text-xs text-gray-400">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </>
  )
}
