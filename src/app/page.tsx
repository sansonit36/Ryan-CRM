import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, Video, Users, DollarSign, ArrowRight, CheckCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500 rounded-full blur-[150px] opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full blur-[150px] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600 rounded-full blur-[200px] opacity-10" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Ryan CRM</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                  Sign in
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-white text-violet-900 hover:bg-white/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Content Management Made Simple
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Manage Your
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {" "}Content Creation{" "}
              </span>
              Business
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              A modern dashboard for editors, social media managers, and investors.
              Track videos, manage expenses, and monitor your business growth all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8">
                  Start for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white/30 hover:bg-white/10">
                  Sign in to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Video Management</h3>
              <p className="text-slate-400">
                Upload Google Drive links, track video status, and manage your content pipeline.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Review System</h3>
              <p className="text-slate-400">
                Social managers can approve or reject videos with detailed feedback.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Expense Tracking</h3>
              <p className="text-slate-400">
                Track expenses, salaries, subscriptions with receipt uploads and beautiful charts.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Role-Based Access</h3>
              <p className="text-slate-400">
                Different dashboards for editors, social managers, admins, and investors.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to streamline your content business?
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Join Ryan CRM today and take control of your content creation workflow.
            </p>
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Ryan CRM</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2025 Ryan CRM. Built for content creators.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
