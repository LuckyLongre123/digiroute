import {
  MapPin,
  Search,
  Camera,
  Navigation,
  AlertTriangle,
  Hammer,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    // Mobile-first constraint container: Keeps UI neat and readable even on ultra-wide desktop monitors
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-4">
      {/* 1. Header & App Status */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            DigiRoute
          </h1>
          <p className="text-sm font-medium text-zinc-500">
            Powered by DIGIPIN
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700"
        >
          <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Online
        </Badge>
      </header>

      {/* 2. Primary Navigation Search Bar (Big Touch Target) */}
      <section className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Enter DIGIPIN..."
            className="h-14 border-zinc-300 bg-white pl-12 font-mono text-lg uppercase shadow-sm focus-visible:ring-zinc-500"
            maxLength={10}
          />
        </div>
        <Button
          size="icon"
          className="h-14 w-14 shrink-0 rounded-xl bg-zinc-900 hover:bg-zinc-800"
        >
          <Navigation className="h-6 w-6" />
        </Button>
      </section>

      <Separator className="my-1" />

      {/* 3. Core Operational Modes (Visual Grid) */}
      <section className="grid grid-cols-2 gap-3">
        {/* Mode 1: Smart E-commerce (Primary Action) */}
        <Card className="col-span-2 cursor-pointer border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 active:scale-[0.98]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="shrink-0 rounded-full bg-zinc-100 p-3">
              <Camera className="h-7 w-7 text-zinc-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-zinc-900">Visual Lock</h3>
              <p className="mt-0.5 text-sm leading-tight text-zinc-500">
                Snap photo & pin exact door for deliveries.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mode 2: Emergency Response */}
        <Card className="cursor-pointer border-red-200 bg-red-50 shadow-sm transition-transform active:scale-[0.98]">
          <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="mb-1 rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="leading-tight font-semibold text-red-900">
              SOS Dispatch
            </h3>
          </CardContent>
        </Card>

        {/* Mode 3: Civic Infrastructure */}
        <Card className="cursor-pointer border-zinc-200 bg-white shadow-sm transition-transform hover:border-zinc-300 active:scale-[0.98]">
          <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="mb-1 rounded-full bg-zinc-100 p-2">
              <Hammer className="h-7 w-7 text-zinc-700" />
            </div>
            <h3 className="leading-tight font-semibold text-zinc-900">
              Report Issue
            </h3>
          </CardContent>
        </Card>
      </section>

      {/* 4. Local Staging / Recent Addresses Book */}
      <section className="mt-2">
        <h2 className="mb-3 px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">
          Recent Micro-Addresses
        </h2>
        <div className="flex flex-col gap-3">
          {/* Example Address Card (Later we will map this from IndexedDB/Zustand) */}
          <Card className="border-zinc-200 bg-white shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0 rounded-lg bg-zinc-100 p-2">
                  <MapPin className="h-5 w-5 text-zinc-600" />
                </div>
                <div className="truncate">
                  <h4 className="truncate text-base font-bold text-zinc-900">
                    Home - Gate 2
                  </h4>
                  <p className="mt-0.5 font-mono text-xs tracking-wide text-zinc-500">
                    IN-DP-84-X9-2B
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-9 shrink-0 px-3">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
