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

// WhatsApp Icon Component (Official Logo)
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
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
      name: 'Info Session WhatsApp Grubu',
      icon: WhatsAppIcon,
      url: 'https://chat.whatsapp.com/HxT7WrhgVrl4sRngCsWxLy?mode=wwc',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:shadow-green-500/50'
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
