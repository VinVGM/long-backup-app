"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { createOrder, getCurrentUserProfile } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Check } from "lucide-react"

const plans = [
  { id: "basic_100gb", name: "Basic", storageGb: 100, desc: "Backups for personal projects", monthly: 9900, yearly: 99900, monthlyDisplay: "₹99", yearlyDisplay: "₹999" },
  { id: "pro_500gb", name: "Pro", storageGb: 500, desc: "For professionals and small teams", monthly: 19900, yearly: 199900, monthlyDisplay: "₹199", yearlyDisplay: "₹1,999", popular: true },
  { id: "business_2tb", name: "Business", storageGb: 2000, desc: "For businesses with large datasets", monthly: 44900, yearly: 449900, monthlyDisplay: "₹449", yearlyDisplay: "₹4,499" },
]

export default function PricingPage() {
  const router = useRouter()
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>("free")
  const [error, setError] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [upgradedPlan, setUpgradedPlan] = useState("")

  useEffect(() => {
    getCurrentUserProfile()
      .then((user) => setCurrentPlan(user.plan || "free"))
      .catch(() => {})
      .finally(() => setPageLoading(false))
  }, [])

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    setError("")
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
        theme: { color: "#3b82f6" },
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
            setTimeout(() => { setShowSuccessOverlay(false); router.push("/dashboard/settings") }, 3000)
          } catch { setError("Payment verification failed. Please contact support.") }
        },
        modal: { ondismiss: () => setLoading(null) },
      }
      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      setError(err?.message || "Failed to create order")
    } finally { setLoading(null) }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-8 w-28" />
                {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-4 w-40" />)}
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Pricing</h1>
          <p className="text-center text-muted-foreground mb-8">Choose the plan that fits your needs</p>

          {currentPlan !== "free" && (
            <div className="text-center mb-8 text-sm text-primary bg-primary/10 border border-primary/20 rounded-lg p-3">
              You are currently on the <strong>{plans.find(p => p.id === currentPlan)?.name || "Pro"}</strong> plan.
            </div>
          )}

          <div className="flex justify-center items-center gap-3 mb-10">
            <span className={`text-sm ${!yearly ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button onClick={() => setYearly(!yearly)}
              className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "bg-primary" : "bg-secondary"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full transition-transform ${yearly ? "translate-x-6" : ""}`} />
            </button>
            <span className={`text-sm ${yearly ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Yearly <span className="text-green-500 text-xs font-medium">Save ~17%</span>
            </span>
          </div>

          {error && <p className="text-center text-destructive text-sm mb-4">{error}</p>}

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id
              const price = yearly ? plan.yearlyDisplay : plan.monthlyDisplay
              const period = yearly ? "/yr" : "/mo"

              return (
                <Card key={plan.id} className={`relative ${plan.popular ? "border-primary ring-1 ring-primary" : ""} ${isCurrent ? "opacity-75" : ""}`}>
                  <CardContent className="p-6 flex flex-col space-y-4">
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">Most Popular</span>
                    )}
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.desc}</p>
                    <div className="text-3xl font-bold">{price}<span className="text-sm font-normal text-muted-foreground">{period}</span></div>
                    <ul className="space-y-2 text-sm flex-1">
                      {[`${plan.storageGb} GB storage`, "Deep Archive storage", "Email notifications", "48h download links"].map((feat, j) => (
                        <li key={j} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{feat}</li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button disabled variant="outline" className="w-full">Current Plan</Button>
                    ) : (
                      <Button onClick={() => handleSubscribe(plan.id)} disabled={loading !== null}
                        className={`w-full ${plan.popular ? "" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}>
                        {loading === plan.id ? "Processing..." : "Subscribe"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm mx-4 shadow-xl text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">Payment Successful!</h2>
            <p className="text-muted-foreground">Welcome to <strong>{plans.find(p => p.id === upgradedPlan)?.name || ""}</strong> Plan</p>
            <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </>
  )
}
