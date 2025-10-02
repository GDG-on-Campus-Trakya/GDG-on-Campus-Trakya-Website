// components/EventList.jsx

"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const isExpired = (eventDate, eventTime, isClient = true) => {
  if (!isClient) return false; // Return false during SSR to avoid hydration mismatch
  const now = new Date();
  const [hours, minutes] = eventTime.split(':').map(Number);
  const eventDateTime = new Date(eventDate);
  eventDateTime.setHours(hours, minutes, 0, 0);

  // Add 6 hours grace period after event ends for QR code visibility
  const graceEndTime = new Date(eventDateTime);
  graceEndTime.setHours(graceEndTime.getHours() + 6);

  return now > graceEndTime;
};

// Updated formatDate function to accept options
const formatDate = (date, options = {}) => {
  const d = new Date(date);
  return d.toLocaleString("tr-TR", options);
};

const EventList = ({
  registrations,
  events,
  removeRegistration,
  qrCodes,
  downloadQRCode,
}) => {
  const [enlargedQR, setEnlargedQR] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent body scroll when QR modal is open
  useEffect(() => {
    if (enlargedQR) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [enlargedQR]);

  if (registrations.length === 0) {
    return (
      <p className="text-gray-400">Henüz bir etkinliğe kayıt olmadınız.</p>
    );
  }

  return (
    <ul className="list-none p-0 flex flex-col gap-5">
      {registrations.map((registration) => {
        const event = events.find((evt) => evt.id === registration.eventId);
        if (!event) return null;

        const signedUpDate = formatDate(
          registration.signedUpAt?.seconds * 1000 || (isClient ? Date.now() : 0),
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );

        const expired = isExpired(event.date, event.time, isClient);
        const status = expired ? "Geçmiş" : "Yaklaşan";
        const statusColor =
          status === "Yaklaşan" ? "bg-green-600" : "bg-red-600";

        return (
          <motion.li
            key={registration.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.01 }}
            className="flex flex-col md:flex-row items-start md:items-center bg-gray-800 p-5 rounded-lg shadow-md space-y-4 md:space-y-0 md:space-x-6"
          >
            {/* Event Image */}
            <img
              src={event.imageUrl || "/default-event.png"}
              alt={event.name}
              className="w-32 h-32 object-cover rounded"
            />

            {/* Event Details */}
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-white">
                {event.name}
              </h3>
              <div className="mt-2">
                <p>
                  <strong>Etkinlik Tarihi:</strong>{" "}
                  {formatDate(event.date, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })} {event.time}
                </p>
                <p>
                  <strong>Etkinlik Lokasyonu:</strong> {event.location}
                </p>
                <p>
                  <strong>Kayıt Tarihi:</strong> {signedUpDate}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {/* Category Tag */}
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                  {event.category}
                </span>
                {/* Status Tag */}
                <span
                  className={`inline-block px-3 py-1 text-white text-sm rounded-full ${statusColor}`}
                >
                  {status}
                </span>
              </div>
            </div>

            {/* QR Code and Actions */}
            <div className="flex flex-col gap-4">
              {!expired && qrCodes[registration.qrCodeId] && (
                <div className="flex flex-col items-center gap-2">
                  <motion.img
                    src={qrCodes[registration.qrCodeId]}
                    alt="QR Code"
                    className="w-32 h-32 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setEnlargedQR({
                      qrCode: qrCodes[registration.qrCodeId],
                      eventName: event.name
                    })}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                  <button
                    onClick={() =>
                      downloadQRCode(qrCodes[registration.qrCodeId], event.name)
                    }
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                  >
                    Kodu İndir
                  </button>
                </div>
              )}
              {!expired && (
                <button
                  onClick={() => removeRegistration(registration)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors w-full"
                >
                  Kayıt Sil
                </button>
              )}
              {expired && (
                <p className="text-gray-500 text-center">
                  Bu etkinlik sona erdiği için QR kodu mevcut değil.
                </p>
              )}
            </div>
          </motion.li>
        );
      })}

      {/* QR Code Enlargement Modal */}
      <AnimatePresence>
        {enlargedQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEnlargedQR(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {enlargedQR.eventName}
                </h3>
                <button
                  onClick={() => setEnlargedQR(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <img
                    src={enlargedQR.qrCode}
                    alt="QR Code"
                    className="w-64 h-64 sm:w-80 sm:h-80"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={() => downloadQRCode(enlargedQR.qrCode, enlargedQR.eventName)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Kodu İndir
                  </button>
                  <button
                    onClick={() => setEnlargedQR(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ul>
  );
};

export default EventList;
