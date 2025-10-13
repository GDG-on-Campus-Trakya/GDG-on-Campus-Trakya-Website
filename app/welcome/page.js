'use client';

import { useState, useEffect } from 'react';
import { Instagram, Linkedin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// TikTok Icon Component
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const socialLinks = [
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://www.instagram.com/gdgoncampustu/',
      color: 'from-purple-600 to-pink-600',
      hoverColor: 'hover:shadow-purple-500/50'
    },
    {
      name: 'TikTok',
      icon: TikTokIcon,
      url: 'https://www.tiktok.com/@gdg.on.campus.trakya?_t=ZS-90WYQTJFhiS&_r=1',
      color: 'from-black to-gray-900',
      hoverColor: 'hover:shadow-gray-500/50'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://www.linkedin.com/company/gdscedirne/posts/?feedView=all',
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:shadow-blue-500/50'
    },
    {
      name: 'Siteye Devam Et',
      icon: ArrowRight,
      url: '/',
      color: 'from-green-600 to-emerald-600',
      hoverColor: 'hover:shadow-green-500/50',
      isInternal: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Profile Section */}
        <div className={`text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="mb-4 inline-block">
            <div className="w-24 h-24 mx-auto flex items-center justify-center">
              <Image src="/logo.svg" alt="GDG on Campus Trakya Logo" width={96} height={96} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            GDG on Campus Trakya Üniversitesi
          </h1>
          <p className="text-gray-400">
            Hoş geldiniz! Bizi takip edin ve keşfedin.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-4">
          {socialLinks.map((link, index) => {
            const Icon = link.icon;
            const delay = index * 100;

            const LinkComponent = link.isInternal ? Link : 'a';
            const linkProps = link.isInternal
              ? { href: link.url }
              : { href: link.url, target: '_blank', rel: 'noopener noreferrer' };

            return (
              <div
                key={link.name}
                className={`transition-all duration-700 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${delay}ms` }}
              >
                <LinkComponent
                  {...linkProps}
                  className={`group relative block w-full bg-gradient-to-r ${link.color} p-4 rounded-2xl shadow-lg hover:shadow-2xl ${link.hoverColor} transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <span className="font-semibold text-lg">{link.name}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </LinkComponent>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 text-gray-500 text-sm transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '400ms' }}>
          <p>©2025 GDG on Campus Trakya Üniversitesi</p>
        </div>
      </div>
    </div>
  );
}
