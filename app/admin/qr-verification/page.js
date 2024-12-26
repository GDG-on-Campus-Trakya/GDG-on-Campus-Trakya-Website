"use client";
// admin/qr-verification/page.js
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

export default function AdminQRVerificationPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [qrCodeData, setQRCodeData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);
        setIsAdmin(adminSnap.exists());
      } catch (error) {
        console.error("Error checking admin privileges:", error);
        setIsAdmin(false);
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const startScanning = async () => {
    setScanning(true);
    setQRCodeData(null);
    setVerificationResult(null);
    setError(null);

    try {
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state !== Html5Qrcode.state.NOT_STARTED) {
            await scanner.stop();
          }
        } catch (stopError) {
          console.log("Scanner was already stopped");
        }
        setScanner(null);
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            console.log("Found QR code:", decodedText);
            setQRCodeData(decodedText);
            await html5QrCode.stop();
            setScanning(false);
            await verifyQRCode(decodedText);
          } catch (error) {
            console.error("Error processing QR code:", error);
            setError("Error processing QR code. Please try again.");
          }
        },
        (errorMessage) => {
          if (!errorMessage.includes("NotFoundException")) {
            console.log("QR code parse error, error =", errorMessage);
          }
        }
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      setError("Unable to access camera. Please ensure you've granted camera permissions.");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scanner && scanner.getState() !== Html5Qrcode.state.NOT_STARTED) {
      await scanner.stop();
      setScanner(null);
    }
    setScanning(false);
  };

  const verifyQRCode = async (data) => {
    try {
      console.log("Verifying QR code:", data);    
      const match = data.match(/qrCode=([^,\s]+)/);
      const qrCodeId = match ? match[1] : null;
      
      if (!qrCodeId) {
        setVerificationResult("Invalid QR Code format");
        return;
      }

      try {
        // Get registration data first
        const registrationsRef = collection(db, "registrations");
        const registrationQuery = query(registrationsRef, where("qrCodeId", "==", qrCodeId));
        const registrationSnapshot = await getDocs(registrationQuery);

        if (registrationSnapshot.empty) {
          setVerificationResult("Registration not found");
          return;
        }

        const registrationDoc = registrationSnapshot.docs[0];
        const registrationData = registrationDoc.data();

        if (registrationData.didJoinEvent) {
          setVerificationResult("This QR code has already been verified!");
          return;
        }

        const usersRef = collection(db, "users");
        const docId = registrationData.userId;
        const userDocRef = doc(usersRef, docId);
        const userSnapshot = await getDoc(userDocRef);
        
        if (!userSnapshot.exists()) {
          setVerificationResult("User not found");
          return;
        }

        const userData = userSnapshot.data();

        if (!registrationData.eventId) {
          setVerificationResult("Event ID not found in registration");
          return;
        }

        const eventsRef = collection(db, "events");
        const eventQuery = query(eventsRef, where("id", "==", registrationData.eventId));
        const eventSnapshot = await getDocs(eventQuery);

        if (eventSnapshot.empty) {
          setVerificationResult("Event not found");
          return;
        }

        const eventDoc = eventSnapshot.docs[0];
        const eventData = eventDoc.data();

        await updateDoc(registrationDoc.ref, {
          didJoinEvent: true,
          verifiedAt: new Date(),
          verifiedBy: user.email
        });

        setVerificationResult(`Verified: ${eventData.name} - ${userData.email} - ${userData.name}`);
        
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        setVerificationResult("Database error during verification");
      }
    } catch (error) {
      console.error("Error verifying QR code:", error);
      setVerificationResult("Error verifying QR code");
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Admin QR Code Verification
      </h1>

      <div className="max-w-md mx-auto bg-white rounded-lg p-6 shadow-md">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div id="qr-reader" className="w-full"></div>
        
        {!scanning && (
          <button
            onClick={startScanning}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors mt-4"
          >
            Start Scanning
          </button>
        )}
        
        {scanning && (
          <button
            onClick={stopScanning}
            className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors mt-4"
          >
            Stop Scanning
          </button>
        )}

        {qrCodeData && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h2 className="font-semibold text-gray-700">Scanned QR Code:</h2>
            <p className="text-gray-600 break-all">{qrCodeData}</p>
          </div>
        )}

        {verificationResult && (
          <div className={`mt-4 p-3 rounded-md ${
            verificationResult.startsWith("Verified") 
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            <p>{verificationResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}