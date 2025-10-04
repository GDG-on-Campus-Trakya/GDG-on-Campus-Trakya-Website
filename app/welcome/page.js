'use client';

import { useState, useEffect } from 'react';
import { Instagram, Linkedin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-bold text-white">GDG</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            GDG on Campus Trakya
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
