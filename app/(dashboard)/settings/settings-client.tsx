'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export function SettingsClient() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage your organization's profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input id="orgName" defaultValue="My Organization" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="accentColor">Accent Color</Label>
                <Input
                  id="accentColor"
                  type="color"
                  defaultValue="#3b82f6"
                  className="mt-1 h-12 w-32"
                />
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Page Customization</CardTitle>
              <CardDescription>
                Customize how your public event pages look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo">Organization Logo</Label>
                <Input id="logo" type="file" accept="image/*" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="fontStyle">Font Style</Label>
                <select
                  id="fontStyle"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue="default"
                >
                  <option value="default">Default</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                </select>
              </div>

              <div>
                <Label>Background</Label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="background" value="light" defaultChecked />
                    Light
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="background" value="dark" />
                    Dark
                  </label>
                </div>
              </div>

              <Button>Save Customization</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
