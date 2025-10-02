"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function TermsConsentModal({ isOpen, onAccept, onDecline }) {
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAccept = () => {
    if (privacyAccepted && termsAccepted) {
      onAccept();
    }
  };

  const bothAccepted = privacyAccepted && termsAccepted;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="bg-gray-800 text-white border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-400">
            Hoş Geldiniz! 👋
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-base mt-4">
            GDG on Campus Trakya platformuna hoş geldiniz. Devam etmeden önce,
            lütfen aşağıdaki şartları okuyup kabul edin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-6">
          {/* Privacy Policy Checkbox */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-700/30 border border-gray-600/50">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={setPrivacyAccepted}
              className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <div className="flex-1">
              <Label
                htmlFor="privacy"
                className="text-sm font-medium text-white cursor-pointer"
              >
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Gizlilik Politikasını
                </Link>{" "}
                okudum ve kabul ediyorum.
              </Label>
              <p className="text-xs text-gray-400 mt-1">
                Kişisel verilerinizin nasıl toplandığını, kullanıldığını ve
                korunduğunu öğrenin.
              </p>
            </div>
          </div>

          {/* Terms of Service Checkbox */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-700/30 border border-gray-600/50">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
              className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <div className="flex-1">
              <Label
                htmlFor="terms"
                className="text-sm font-medium text-white cursor-pointer"
              >
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Kullanım Şartlarını
                </Link>{" "}
                okudum ve kabul ediyorum.
              </Label>
              <p className="text-xs text-gray-400 mt-1">
                Platform kullanımı, hesap sorumluluklarınız ve topluluk
                kurallarını inceleyin.
              </p>
            </div>
          </div>

          {/* KVKK Information */}
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
            <p className="text-sm text-gray-300 leading-relaxed">
              <strong className="text-blue-400">KVKK Bilgilendirmesi:</strong>{" "}
              Bu platform KVKK (Kişisel Verilerin Korunması Kanunu) uyarınca
              kişisel verilerinizi açık rızanızla işlemektedir. Verileriniz
              yalnızca etkinlik organizasyonu, istatistiksel analiz ve destek
              hizmetleri için kullanılacaktır.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onDecline}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 w-full sm:w-auto"
          >
            Reddet ve Çıkış Yap
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!bothAccepted}
            className={`w-full sm:w-auto ${
              bothAccepted
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            Kabul Et ve Devam Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
