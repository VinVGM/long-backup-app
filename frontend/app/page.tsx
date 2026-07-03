import Link from "next/link"
import { HardDrive, Download, Clock, Shield, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RetroGrid } from "@/components/ui/retro-grid"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { MagicCard } from "@/components/ui/magic-card"
import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/ui/terminal"
import NumberTicker from "@/components/ui/number-ticker"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Pathrama-Up</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/dashboard/archives" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/auth/signup"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <RetroGrid />
        <div className="container mx-auto max-w-5xl text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in">
            Reliable Cloud{" "}
            <span className="text-primary">Backups</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Secure, long-term backup storage for your important files.
            Simple to use, reliable when you need it.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <ShimmerButton shimmerColor="#ffffff" background="rgba(59, 130, 246, 1)" borderRadius="12px" className="h-12 px-8 text-base font-semibold">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </ShimmerButton>
            </Link>
            <Link href="#features"><Button variant="outline" size="lg" className="h-12 px-8 text-base">Learn More</Button></Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1"><NumberTicker value={1} /> GB</div>
              <div className="text-sm text-muted-foreground">Free storage</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">12-48<span className="text-2xl">h</span></div>
              <div className="text-sm text-muted-foreground">Restore time</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1"><NumberTicker value={99} /><span className="text-2xl">.9</span>%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1"><NumberTicker value={10000} />+</div>
              <div className="text-sm text-muted-foreground">Files Secured</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Simple, secure backup storage for your files.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Upload & Forget", desc: "Your files are securely stored and managed automatically. No manual maintenance required.", stat: "Automatic storage" },
              { icon: Clock, title: "Restore When Needed", desc: "Need a file back? Request a restore and get an email when it's ready. Simple and straightforward.", stat: "12-48h restore" },
              { icon: Download, title: "Download Anywhere", desc: "Access your restored files from any device with a secure download link. No app needed.", stat: "Secure download links" },
            ].map((feature, i) => (
              <MagicCard key={i} className="border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  <div className="pt-2 text-sm font-medium text-primary">{feature.stat}</div>
                </CardContent>
              </MagicCard>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal demo */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Real-Time <span className="text-primary">Backup Agent</span></h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">Watch your backups being processed in real-time. Our agent handles everything automatically.</p>
              <ul className="space-y-3">
                {["Automatic secure storage", "End-to-end encryption", "Instant email notifications", "Secure download links"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />{feat}
                  </li>
                ))}
              </ul>
            </div>
            <Terminal>
              <TypingAnimation className="text-primary font-bold block mb-2">&gt; INITIALIZING BACKUP AGENT...</TypingAnimation>
              <AnimatedSpan delay={1200} className="text-green-500"><span>✔ [OK] Storage initialized</span></AnimatedSpan>
              <AnimatedSpan delay={1800} className="text-green-500"><span>✔ [OK] Connection established</span></AnimatedSpan>
              <AnimatedSpan delay={2400} className="text-blue-500"><span>ℹ [INFO] Scanning local files...</span></AnimatedSpan>
              <AnimatedSpan delay={3000} className="text-green-500"><span>✔ [OK] Found 127 files to backup</span></AnimatedSpan>
              <AnimatedSpan delay={3600} className="text-yellow-500"><span>⚙ [PROC] Uploading archive_2025_06.zip</span></AnimatedSpan>
              <AnimatedSpan delay={4200} className="text-green-500"><span>✔ [OK] Upload complete</span></AnimatedSpan>
              <AnimatedSpan delay={5000} className="text-yellow-500"><span>⚙ [PROC] Compressing remaining 126 files...</span></AnimatedSpan>
              <TypingAnimation delay={6000} className="text-primary font-bold block mt-3">&gt; BACKUP AGENT RUNNING</TypingAnimation>
            </Terminal>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Pricing</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-12">Choose a plan that fits your needs.</p>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { name: "Free", price: "₹0", storage: "1 GB", popular: false },
              { name: "Basic", price: "₹99", storage: "100 GB", popular: false },
              { name: "Pro", price: "₹199", storage: "500 GB", popular: true },
            ].map((plan, i) => (
              <Card key={i} className={`relative ${plan.popular ? "border-primary ring-1 ring-primary" : ""}`}>
                <CardContent className="p-6 space-y-4">
                  {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">Most Popular</span>}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-sm text-muted-foreground">{plan.storage} storage</p>
                  <ul className="space-y-2 text-sm text-left">
                    {["Secure storage", "Email notifications", "Download links"].map((feat, j) => (
                      <li key={j} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{feat}</li>
                    ))}
                  </ul>
                  <Link href="/auth/signup"><Button variant={plan.popular ? "default" : "outline"} className="w-full">{plan.name === "Free" ? "Start Free" : "Subscribe"}</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <Link href="/pricing"><Button variant="link" className="text-muted-foreground">View all plans & pricing details →</Button></Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start backing up?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Sign up free with 1 GB storage.</p>
          <Link href="/auth/signup"><Button size="lg" className="h-13 px-8 text-base">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border px-6">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><HardDrive className="h-4 w-4" />Pathrama-Up</div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Pathrama-Up</p>
        </div>
      </footer>
    </div>
  )
}
