import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { GuideSection } from './guide-content'
import { PlayCircle, Image as ImageIcon, AlertTriangle, HeartHandshake, ArrowRight } from 'lucide-react'

export function GuideShell({
  children,
  sections,
}: {
  children: React.ReactNode
  sections: { id: string; title: string }[]
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-8">
        <header className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lexnify User Guide</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Don’t worry. Just follow this.</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Simple steps for small event organizers. Calm, safe, and easy on mobile.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/landing"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Learn about Lexnify
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <Link
                href="/sign-in"
                className="text-sm font-medium text-primary hover:opacity-90 underline underline-offset-4"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile top navigation (simple tabs) */}
        <div className="mx-auto mt-6 max-w-6xl lg:hidden">
          <div className="rounded-xl border bg-card/80 backdrop-blur p-2 shadow-sm">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="shrink-0 rounded-full border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-3">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Guide Sections</CardTitle>
                  <CardDescription className="text-xs">
                    Click a section. You won’t break anything.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {s.title}
                    </a>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                      <HeartHandshake className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">A quick promise</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Most actions are safe. You can edit later. Nothing gets deleted by accident.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

export function QuickStartVideoCard() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Quick Start (Video)</CardTitle>
            <CardDescription>
              A calm 2–3 minute walkthrough. Watch once and you’re set.
            </CardDescription>
          </div>
          <Badge variant="secondary">Optional</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="aspect-video w-full rounded-lg border bg-background flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-center">
              <PlayCircle className="h-10 w-10" />
              <p className="text-sm font-medium">QUICK START VIDEO PLACEHOLDER</p>
              <p className="text-xs text-muted-foreground">Replace with a video URL later</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <p>Tip: Use full screen on mobile.</p>
            <span className="inline-flex items-center gap-1">
              Start here <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GuideSectionCard({ section }: { section: GuideSection }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl">{section.title}</CardTitle>
            <Badge variant="outline" className="bg-background">
              Simple steps
            </Badge>
          </div>
          <CardDescription className="text-sm">{section.shortIntro}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Screenshot placeholder */}
          <PlaceholderBlock
            icon={<ImageIcon className="h-5 w-5" />}
            title="Screenshot"
            label={section.screenshotLabel || 'SAMPLE SCREENSHOT HERE'}
          />

          {/* Steps */}
          <div className="rounded-xl border bg-background p-4">
            <p className="text-sm font-medium">Do this:</p>
            <ol className="mt-3 space-y-2">
              {section.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                      'bg-primary/5 text-primary border-primary/20'
                    )}
                  >
                    {idx + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Common mistake */}
          <div className="rounded-xl border bg-amber-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-amber-500/10 p-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">Common confusion</p>
                <p className="mt-1 text-sm text-amber-900/80">{section.commonMistake}</p>
              </div>
            </div>
          </div>

          {/* Reassurance */}
          <div className="rounded-xl border bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                <HeartHandshake className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Don’t worry</p>
                <p className="mt-1 text-sm text-muted-foreground">{section.reassurance}</p>
              </div>
            </div>
          </div>

          {/* Tutorial video placeholder */}
          <PlaceholderBlock
            icon={<PlayCircle className="h-5 w-5" />}
            title="Short video (optional)"
            label={section.tutorialVideoLabel || 'TUTORIAL VIDEO PLACEHOLDER'}
          />
        </CardContent>
      </Card>
    </section>
  )
}

function PlaceholderBlock({
  icon,
  title,
  label,
}: {
  icon: React.ReactNode
  title: string
  label: string
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-background p-2 border">
            <div className="text-muted-foreground">{icon}</div>
          </div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        <Badge variant="secondary">Placeholder</Badge>
      </div>
    </div>
  )
}

