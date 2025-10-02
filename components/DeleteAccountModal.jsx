"use client";
import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch 
} from "firebase/firestore";
import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

const CONFIRMATION_TEXT = "HESABIMI SİLMEK İSTİYORUM";

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const [user] = useAuthState(auth);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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

  const handleDeleteAccount = async () => {
    if (confirmationText !== CONFIRMATION_TEXT) {
      toast.error("Doğrulama metni yanlış girildi!");
      return;
    }

    if (!user) {
      toast.error("Kullanıcı oturumu bulunamadı!");
      return;
    }

    setIsDeleting(true);
    
    try {
      const batch = writeBatch(db);

      // 1. Delete user document from 'users' collection
      const userRef = doc(db, 'users', user.uid);
      batch.delete(userRef);

      // 2. Delete all registrations
      const registrationsQuery = query(
        collection(db, 'registrations'), 
        where('userId', '==', user.uid)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      
      const qrCodeIds = [];
      registrationsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.qrCodeId) {
          qrCodeIds.push(data.qrCodeId);
        }
        batch.delete(doc.ref);
      });

      // 3. Delete associated QR codes
      for (const qrCodeId of qrCodeIds) {
        const qrCodeRef = doc(db, 'qrCodes', qrCodeId);
        batch.delete(qrCodeRef);
      }

      // 4. Delete all posts by the user
      const postsQuery = query(
        collection(db, 'posts'), 
        where('authorId', '==', user.uid)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      postsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 5. Delete all comments by the user
      const commentsQuery = query(
        collection(db, 'comments'), 
        where('authorId', '==', user.uid)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      commentsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 6. Delete all likes by the user
      const likesQuery = query(
        collection(db, 'likes'), 
        where('userId', '==', user.uid)
      );
      const likesSnapshot = await getDocs(likesQuery);
      
      likesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 7. Delete all tickets by the user
      const ticketsQuery = query(
        collection(db, 'tickets'), 
        where('authorId', '==', user.uid)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      ticketsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Commit all Firestore operations
      await batch.commit();

      // 8. Finally, delete the user from Firebase Auth
      try {
        await deleteUser(user);
        toast.success("Hesabınız başarıyla silindi!");
        router.push("/");
        onClose();
      } catch (authError) {
        if (authError.code === 'auth/requires-recent-login') {
          // Try to reauthenticate
          try {
            toast.info("Güvenlik için tekrar giriş yapmanız gerekiyor...");
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, provider);
            
            // Try deleting again after reauthentication
            await deleteUser(user);
            toast.success("Hesabınız başarıyla silindi!");
            router.push("/");
            onClose();
          } catch (reauthError) {
            console.error("Reauthentication error:", reauthError);
            if (reauthError.code === 'auth/popup-closed-by-user') {
              toast.error("Tekrar giriş işlemi iptal edildi. Güvenlik nedeniyle çıkış yapılıyor...");
            } else {
              toast.error("Tekrar giriş başarısız. Güvenlik nedeniyle çıkış yapılıyor...");
            }
            await signOut(auth);
            router.push("/");
            onClose();
          }
        } else {
          throw authError;
        }
      }

    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmationText === CONFIRMATION_TEXT;

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText("");
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="bg-gray-800 text-white border-red-500 border-2 max-w-md">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <AlertDialogTitle className="text-center text-xl font-bold text-red-400">
            Hesabı Kalıcı Olarak Sil
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-gray-300 space-y-3">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-red-300">⚠️ Bu işlem GERİ ALINAMAZ!</p>
              <p className="text-sm">
                Hesabınızı sildiğinizde aşağıdaki tüm verileriniz kalıcı olarak silinecektir:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Profil bilgileriniz ve profil fotoğrafınız</li>
                <li>• Tüm etkinlik kayıtlarınız ve QR kodlarınız</li>
                <li>• Paylaştığınız tüm gönderiler ve fotoğraflar</li>
                <li>• Yaptığınız tüm yorumlar ve beğeniler</li>
                <li>• Oluşturduğunuz destek biletleri</li>
              </ul>
            </div>
            
            <div className="pt-4">
              <p className="font-medium mb-2">
                Devam etmek için aşağıdaki metni tam olarak yazın:
              </p>
              <p className="text-red-300 font-mono text-center bg-red-900/30 p-2 rounded">
                {CONFIRMATION_TEXT}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Doğrulama metnini buraya yazın..."
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            disabled={isDeleting}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 font-mono"
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter className="space-x-2">
          <AlertDialogCancel
            onClick={handleClose}
            disabled={isDeleting}
            className="bg-gray-700 hover:bg-gray-600 text-white border-0"
          >
            İptal
          </AlertDialogCancel>
          
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={!isConfirmationValid || isDeleting}
            className={`
              border-0 text-white flex items-center gap-2
              ${isConfirmationValid 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-600 cursor-not-allowed'
              }
            `}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Siliniyor..." : "Hesabı Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountModal;