import React from "react";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({
  title,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold mb-2">{title}</h1>
        <p className="text-sm text-gray-400 mb-10">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
}