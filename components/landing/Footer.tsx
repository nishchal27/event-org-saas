import Link from 'next/link'
import { TechLogos } from '@/components/landing/TechLogos'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 34 34"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.1326 8.45497C16.5308 7.95801 17.286 7.95453 17.6883 8.44813L27.5164 20.5077C28.0488 21.161 27.5838 22.1395 26.741 22.1395H24.4442C24.1428 22.1395 23.8577 22.0034 23.6678 21.7694L17.7029 14.4188C17.2962 13.9175 16.5285 13.927 16.1346 14.4384L10.7303 21.454C10.5411 21.6996 10.2484 21.8435 9.9383 21.8436H7.4881C6.64925 21.8436 6.18332 20.8733 6.70783 20.2186L16.1326 8.45497Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold">EventOrg</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Create events, notify people on WhatsApp, and track attendance — for groups, instructors, and organizers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#faq"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border/40 pt-8">
          <div className="flex flex-col items-center gap-6">
            {/* Tech Stack - Minimal */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Seamlessly Integrated with
              </p>
              <TechLogos variant="minimal" />
            </div>
            
            {/* Copyright & Links */}
            <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} EventOrg. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
