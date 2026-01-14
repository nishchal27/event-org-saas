'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    description: 'Perfect for trying out EventOrg',
    features: [
      '2 events per month',
      '60 WhatsApp messages/month',
      '10 AI generations/month',
      'Higher contact limit',
      'Event page & registration',
      'Event preview',
    ],
    cta: 'Current Plan',
    popular: false,
    planId: 'free',
  },
  {
    name: 'Monthly',
    price: '₹249',
    period: '/month',
    description: 'For small NGOs & communities',
    features: [
      '15 events per month',
      '300 WhatsApp messages/month',
      '60 AI generations/month',
      'Higher contact limit',
      'WhatsApp automation',
      'AI content generation',
      'CSV export',
      'Reminder messages (1 per event)',
      'Email support',
    ],
    cta: 'Upgrade to Monthly',
    popular: false,
    planId: 'monthly',
  },
  {
    name: 'Monthly Pro',
    price: '₹499',
    period: '/month',
    description: 'For serious & growing organizations',
    features: [
      'Unlimited events',
      '1,000 WhatsApp messages/month',
      '200 AI generations/month',
      'Higher contact limit',
      'Multiple reminders',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Upgrade to Monthly Pro',
    popular: true,
    planId: 'monthly_pro',
  },
]

export function PricingClient() {
  const { data: subscription } = trpc.subscription.get.useQuery()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Pricing</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold">Choose Your Plan</h2>
          <p className="mt-4 text-lg text-gray-600">
            Simple, transparent pricing. Pay only for what you use.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            All plans include higher contact limits. Limits apply to WhatsApp messages and AI generations only.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.planId
            const isUpgrade =
              subscription?.plan === 'free' && plan.planId !== 'free' ||
              subscription?.plan === 'monthly' && plan.planId === 'monthly_pro'

            return (
              <Card
                key={plan.planId}
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      {plan.cta}
                    </Button>
                  ) : plan.planId === 'free' ? (
                    <Button disabled variant="outline" className="w-full">
                      Current Plan
                    </Button>
                  ) : (
                    <Link href={`/api/stripe/checkout?plan=${plan.planId}`} className="block">
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        {isUpgrade ? plan.cta : 'Select Plan'}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need more?{' '}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us for enterprise pricing
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
