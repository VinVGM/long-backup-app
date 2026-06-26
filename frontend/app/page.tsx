import Link from "next/link"
import { Shield, HardDrive, Download, Clock, ArrowRight, Check, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">LongBackup</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/dashboard/archives" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="container mx-auto max-w-5xl text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary text-sm text-muted-foreground mb-8">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Powered by AWS S3 Deep Archive
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in">
            Affordable Long-Term{" "}
            <span className="text-primary">Cloud Backups</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Store your backups in AWS Deep Archive at 95% less cost than Google Drive or Dropbox.
            Pay only for what you store. No monthly subscriptions — just storage.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="h-13 px-8 text-base">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "95%", label: "Cheaper than Google Drive" },
              { value: "1GB", label: "Free storage to start" },
              { value: "12-48h", label: "Restore time from Deep Archive" },
              { value: "99.99%", label: "AWS Durability" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Simple, secure, and cost-effective backup storage.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Upload & Forget",
                desc: "Your files are uploaded directly to AWS Deep Archive — the cheapest storage tier on the planet.",
                stat: "₹0.08/GB/month",
              },
              {
                icon: Clock,
                title: "Restore When Needed",
                desc: "Files transition to Deep Archive after upload. Restore takes 12-48 hours. You'll get an email when ready.",
                stat: "12-48h restore time",
              },
              {
                icon: Download,
                title: "Download Anywhere",
                desc: "48-hour download window with presigned URLs. No app needed — just a browser.",
                stat: "48h download link",
              },
            ].map((feature, i) => (
              <Card key={i} className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  <div className="pt-2 text-sm font-medium text-primary">{feature.stat}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Pricing</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-12">
            Choose a plan that fits your needs. All plans include Deep Archive storage, restores, and email notifications.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { name: "Free", price: "₹0", storage: "1 GB", popular: false },
              { name: "Basic", price: "₹99", storage: "100 GB", popular: false },
              { name: "Pro", price: "₹199", storage: "500 GB", popular: true },
            ].map((plan, i) => (
              <Card key={i} className={`relative ${plan.popular ? "border-primary ring-1 ring-primary" : ""}`}>
                <CardContent className="p-6 space-y-4">
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-sm text-muted-foreground">{plan.storage} storage</p>
                  <ul className="space-y-2 text-sm text-left">
                    {["Deep Archive", "Email notifications", "48h download links"].map((feat, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/signup">
                    <Button variant={plan.popular ? "default" : "outline"} className="w-full">
                      {plan.name === "Free" ? "Start Free" : "Subscribe"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <Link href="/pricing">
            <Button variant="link" className="text-muted-foreground">
              View all plans & pricing details → View all plans & pricing details
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start backing up?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Sign up free with 1 GB storage. No credit card required.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="h-13 px-8 text-base">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border px-6">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            LongBackup
          </div>
          <p className="text-xs text-muted-foreground">Powered by AWS S3 Glacier Deep Archive</p>
        </div>
      </footer>
    </div>
  )
}
