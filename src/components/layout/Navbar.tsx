'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stethoscope, Building2, MapPin, MessageSquare, Plane, User, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">GoChinaMed</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              {t('nav.home')}
            </Link>
            <Link href="/doctors" className="text-gray-700 hover:text-blue-600 font-medium">
              {t('nav.doctors')}
            </Link>
            <Link href="/hospitals" className="text-gray-700 hover:text-blue-600 font-medium">
              {t('nav.hospitals')}
            </Link>
            <Link href="/attractions" className="text-gray-700 hover:text-blue-600 font-medium">
              {t('nav.attractions')}
            </Link>
            <Link href="/community" className="text-gray-700 hover:text-blue-600 font-medium">
              {t('nav.community')}
            </Link>
            <Link href="/ai-assistant" className="text-gray-700 hover:text-blue-600 font-medium">
              {t('nav.aiAssistant')}
            </Link>
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>

            <Link href="/my-trips">
              <Button variant="ghost" size="sm">
                <Plane className="h-4 w-4 mr-2" />
                {t('nav.myTrips')}
              </Button>
            </Link>

            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                {t('nav.profile')}
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" size="sm">
                {t('nav.login')}
              </Button>
            </Link>

            <Link href="/register">
              <Button size="sm">
                {t('nav.register')}
              </Button>
            </Link>

            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4">
          <div className="space-y-4">
            <Link
              href="/"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/doctors"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.doctors')}
            </Link>
            <Link
              href="/hospitals"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.hospitals')}
            </Link>
            <Link
              href="/attractions"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.attractions')}
            </Link>
            <Link
              href="/community"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.community')}
            </Link>
            <Link
              href="/ai-assistant"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.aiAssistant')}
            </Link>
            <div className="pt-4 border-t border-gray-200">
              <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
