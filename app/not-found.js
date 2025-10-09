import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-slate-900 text-white">
      <div className="text-center p-4">
        <h1 className="text-8xl md:text-9xl font-bold text-purple-500 animate-pulse">
          404
        </h1>
        <p className="mt-4 text-xl md:text-2xl font-semibold">
          Oops! Uzayda kaybolmuş gibisin.
        </p>
        <p className="mt-2 text-gray-400">
          Aradığın sayfayı bulamadık. Ama endişelenme, geri dönüş yolunu biliyoruz.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button
              variant="secondary"
              className="rounded-full px-8 py-3 text-lg font-bold transition-transform hover:scale-105"
            >
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
