"use client";
// events/page.js
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Calendar from "../../components/Calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState("upcoming");
  const [user, loading, error] = useAuthState(auth);
  const [signupMessage, setSignupMessage] = useState(null);
  const [signupError, setSignupError] = useState(null);

  const [hasSignedUp, setHasSignedUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const drawerRef = useRef(null);

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isExpired = (eventDate) => new Date(eventDate) < new Date();

  useEffect(() => {
    const checkSignupStatus = async () => {
      if (!user || !selectedEvent) {
        setHasSignedUp(false);
        return;
      }

      try {
        const registrationsRef = collection(db, "registrations");
        const signupQuery = query(
          registrationsRef,
          where("eventId", "==", selectedEvent.id),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(signupQuery);
        setHasSignedUp(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking signup status:", error);
      }
    };

    checkSignupStatus();
  }, [user, selectedEvent]);

  const handleSignup = async () => {
    if (!user) {
      toast.error("Kayıt olmak için giriş yapmalısınız.");
      return;
    }

    try {
      // Check if user has completed their profile
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        toast.error("Profil bilgileriniz bulunamadı.");
        router.push("/profile");
        return;
      }

      const userData = userDoc.data();
      if (!userData.name || !userData.faculty || !userData.department) {
        toast.error(
          "Etkinliğe kayıt olabilmek için profil bilgilerinizi tamamlamanız gerekmektedir."
        );
        router.push("/profile");
        return;
      }

      const registrationsRef = collection(db, "registrations");
      const signupQuery = query(
        registrationsRef,
        where("eventId", "==", selectedEvent.id),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(signupQuery);

      if (!querySnapshot.empty) {
        toast.info("Bu etkinliğe zaten kayıt oldunuz.");
        setHasSignedUp(true);
        return;
      }

      const newRegistration = await addDoc(registrationsRef, {
        eventId: selectedEvent.id,
        userId: user.uid,
        signedUpAt: new Date(),
        didJoinEvent: false,
      });

      const qrCodeRef = collection(db, "qrCodes");
      const newQrCode = await addDoc(qrCodeRef, {
        registrationId: newRegistration.id,
        createdAt: new Date(),
      });

      const qrCodeData = `qrCode=${newQrCode.id}`;

      await updateDoc(doc(qrCodeRef, newQrCode.id), {
        code: qrCodeData,
      });

      await updateDoc(doc(registrationsRef, newRegistration.id), {
        qrCodeId: newQrCode.id,
      });

      toast.success("Etkinliğe başarıyla kayıt oldunuz!");
      setHasSignedUp(true);
    } catch (error) {
      console.error("Error signing up for event:", error);
      toast.error("Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add error handling and loading states
        const eventsSnapshot = await getDocs(collection(db, "events"));
        if (!eventsSnapshot.empty) {
          const eventsData = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
          setEvents(eventsData);
        } else {
          console.log("No events found");
          setEvents([]);
        }

        const sponsorsSnapshot = await getDocs(collection(db, "sponsors"));
        if (!sponsorsSnapshot.empty) {
          const sponsorsData = sponsorsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSponsors(sponsorsData);
        } else {
          console.log("No sponsors found");
          setSponsors([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set empty arrays to prevent undefined errors
        setEvents([]);
        setSponsors([]);
      }
    };

    fetchData().then(() => {
      handleQRCodeRedirect();
    });
  }, []);

  // Add another effect to handle QR code redirect when events change
  useEffect(() => {
    if (events.length > 0) {
      handleQRCodeRedirect();
    }
  }, [events]); // Run when events are updated

  const handleQRCodeRedirect = async () => {
    const qrCodeId = searchParams.get("qrCode");

    if (qrCodeId && !selectedEvent && events.length > 0) {
      try {
        const qrCodeRef = doc(db, "eventQrCodes", qrCodeId);
        const qrCodeSnap = await getDoc(qrCodeRef);

        if (qrCodeSnap.exists()) {
          const eventId = qrCodeSnap.data().eventId;
          const event = events.find((e) => e.id === eventId);

          if (event) {
            setSelectedEvent(event);
          } else {
            toast.error("QR kod için etkinlik bulunamadı.");
          }
        } else {
          toast.error("Geçersiz QR kod.");
        }
      } catch (error) {
        console.error("Error handling QR code redirect:", error);
        toast.error("QR kod işlenirken bir hata oluştu.");
      }
    }
  };

  // Prevent scrolling when drawer is open (çokomelli)
  useEffect(() => {
    if (selectedEvent) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedEvent]);

  // Memoize event dates for performance (ilk defa memo kullandım)
  const eventDates = useMemo(() => {
    return new Set(events.map((event) => formatDate(event.date)));
  }, [events]);

  const getDayLabel = (date) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate.toDateString() === today.toDateString()) {
      return "Bugün";
    }
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (eventDate.toDateString() === tomorrow.toDateString()) {
      return "Yarın";
    }
    return eventDate.toLocaleDateString("tr-TR", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeDrawer = () => {
    setSelectedEvent(null);
  };

  const showPreviousEvent = () => {
    if (!selectedEvent) return;
    const currentIndex = filteredEvents.findIndex(
      (event) => event.id === selectedEvent.id
    );
    const previousIndex =
      (currentIndex - 1 + filteredEvents.length) % filteredEvents.length;
    setSelectedEvent(filteredEvents[previousIndex]);
  };

  const showNextEvent = () => {
    if (!selectedEvent) return;
    const currentIndex = filteredEvents.findIndex(
      (event) => event.id === selectedEvent.id
    );
    const nextIndex = (currentIndex + 1) % filteredEvents.length;
    setSelectedEvent(filteredEvents[nextIndex]);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (
      selectedDate &&
      clickedDate.toDateString() === selectedDate.toDateString()
    ) {
      setSelectedDate(null);
      setFilterStatus("upcoming");
    } else {
      setSelectedDate(clickedDate);
      setFilterStatus(null);
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setSelectedDate(null);
  };

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedDate) {
      const selectedDateStr = formatDate(selectedDate);
      filtered = filtered.filter(
        (event) => formatDate(event.date) === selectedDateStr
      );
    } else if (filterStatus === "upcoming") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((event) => new Date(event.date) >= today);
      // Sort upcoming events from oldest to newest
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (filterStatus === "past") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((event) => new Date(event.date) < today);
      // Sort past events from newest to oldest
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return filtered;
  }, [events, selectedDate, filterStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setSelectedEvent(null);
      }
    };

    if (selectedEvent) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedEvent]);

  const getSponsorsDetails = (sponsorIds) => {
    return sponsors.filter((sponsor) => sponsorIds.includes(sponsor.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-sans bg-gradient-to-b from-[#0a0a19] to-black text-white min-h-screen flex flex-col items-center p-6"
    >
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center mb-6"
      >
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl font-bold mb-3"
        >
          Etkinlikler
        </motion.h1>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg text-gray-400"
        >
          Katılmak istediğiniz etkinlikleri keşfedin ve kaydolun!
        </motion.div>
      </motion.header>

      <main className="flex flex-col lg:flex-row gap-6 justify-center w-full max-w-5xl">
        {/* Calendar Section */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm lg:w-1/3 lg:sticky lg:top-5 flex flex-col gap-4 lg:order-2 order-1 mx-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Calendar
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              handleDateClick={handleDateClick}
              eventDates={eventDates}
            />
          </motion.div>

          {/* Filter Buttons */}
          {!selectedDate && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex justify-between mt-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 py-3 px-4 rounded bg-gray-700 text-gray-400 hover:bg-blue-500 hover:text-white transition-all ${
                  filterStatus === "upcoming" ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => handleFilterChange("upcoming")}
              >
                Yaklaşan
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 py-3 px-4 rounded bg-gray-700 text-gray-400 hover:bg-blue-500 hover:text-white transition-all ${
                  filterStatus === "past" ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => handleFilterChange("past")}
              >
                Geçmiş
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Event List */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="relative flex-1 max-w-[900px] lg:order-1 order-2"
        >
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute left-10 top-0 bottom-0 w-px bg-gray-600"
          />
          <div className="flex flex-col gap-6 ml-14">
            <AnimatePresence>
              {filteredEvents.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {filteredEvents.map((event, index) => {
                    const status = isExpired(event.date)
                      ? "Geçmiş"
                      : "Yaklaşan";
                    const statusColor =
                      status === "Yaklaşan" ? "bg-green-600" : "bg-red-600";

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.5,
                          ease: "easeOut",
                        }}
                        whileHover={{
                          scale: 1.02,
                          backgroundColor: "rgba(55, 65, 81, 0.8)",
                          transition: { duration: 0.2 },
                        }}
                        className="flex items-start bg-gray-800 rounded-lg p-5 shadow-lg cursor-pointer relative hover:bg-gray-700 transition-all"
                        onClick={() => handleEventClick(event)}
                      >
                        {/* Timeline Marker with animation */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: index * 0.1 + 0.3,
                            duration: 0.3,
                          }}
                          className="absolute left-[-60px] top-6 flex flex-col items-center"
                        >
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            className={`w-5 h-5 ${statusColor} rounded-full z-10`}
                          />
                        </motion.div>

                        {/* Event Content */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className="mr-6"
                        >
                          <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-44 h-auto rounded"
                          />
                        </motion.div>

                        {/* Event Details */}
                        <div className="flex flex-col w-full">
                          <h4 className="text-xl text-blue-400">
                            {getDayLabel(event.date)}
                          </h4>
                          <h3 className="mt-2 text-3xl">{event.name}</h3>
                          <div className="mt-1 text-lg text-gray-400">
                            {event.time}
                          </div>
                          <div className="mt-1 text-lg text-gray-400">
                            {event.location}
                          </div>

                          {/* Category and Status Tags */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {/* Category Tag */}
                            <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                              {event.category}
                            </span>
                            {/* Status Tag */}
                            <span
                              className={`inline-block px-3 py-1 text-white text-sm rounded-full ${
                                status === "Yaklaşan"
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="no-events"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center text-gray-400 mt-6"
                >
                  <div className="text-lg text-gray-400 mt-10">
                    Yaklaşan bir etkinlik yok. Takipte kalın!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Drawer with animations */}
      <Drawer
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DrawerContent className="fixed inset-y-0 right-0 h-[98vh] my-auto w-[400px] bg-transparent border-none shadow-2xl">
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "h-full w-full bg-[#0a0a19] text-white p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent rounded-l-lg bg-gray-800"
            )}
          >
            <DrawerHeader className="p-0">
              <div className="flex justify-end space-x-3 mb-6">
                <button
                  className="w-10 h-10 bg-gray-700 text-gray-400 rounded-full hover:bg-gray-600 transition-colors"
                  onClick={showPreviousEvent}
                >
                  &#8592;
                </button>
                <button
                  className="w-10 h-10 bg-gray-700 text-gray-400 rounded-full hover:bg-gray-600 transition-colors"
                  onClick={showNextEvent}
                >
                  &#8594;
                </button>
              </div>
              {selectedEvent && (
                <>
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.name}
                    className="w-full h-auto rounded mb-6 select-none pointer-events-none"
                    draggable="false"
                  />
                  <DrawerTitle className="text-3xl font-bold mb-3">
                    {selectedEvent.name}
                  </DrawerTitle>

                  {/* Wrap content in DrawerDescription for accessibility */}
                  <DrawerDescription asChild>
                    <div className="space-y-4">
                      <div className="text-lg text-gray-400">
                        {getDayLabel(selectedEvent.date)}, {selectedEvent.time}
                      </div>
                      <div className="text-lg text-gray-400">
                        <strong>Kategori:</strong> {selectedEvent.category}
                      </div>
                      <div className="text-lg text-gray-400">
                        <strong>Lokasyon:</strong> {selectedEvent.location}
                      </div>
                      <div className="text-lg text-white">
                        {selectedEvent.description}
                      </div>
                    </div>
                  </DrawerDescription>
                </>
              )}
            </DrawerHeader>

            {selectedEvent && (
              <div className="space-y-6">
                {/* Sponsors Section */}
                {selectedEvent.sponsors &&
                  selectedEvent.sponsors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-2xl font-semibold mb-3">
                        Sponsorluk
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {getSponsorsDetails(selectedEvent.sponsors).map(
                          (sponsor) => (
                            <div
                              key={sponsor.id}
                              className="flex items-center space-x-2"
                            >
                              <img
                                src={sponsor.img_url}
                                alt={sponsor.name}
                                className="w-10 h-10 object-contain"
                              />
                              <span className="text-lg">{sponsor.name}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* File URL Section */}
                {selectedEvent.file_url && (
                  <div className="mb-6">
                    <a
                      href={selectedEvent.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 16l4-4m0 0l4 4m-4-4v12"
                        />
                      </svg>
                      Etkinlik Dokümanları
                    </a>
                  </div>
                )}
              </div>
            )}

            <DrawerFooter className="p-0 mt-6">
              {selectedEvent && !isExpired(selectedEvent.date) ? (
                user ? (
                  hasSignedUp ? (
                    <button
                      className="w-full py-3 bg-gray-500 text-white rounded cursor-not-allowed"
                      disabled
                    >
                      Kayıt Olundu
                    </button>
                  ) : (
                    <>
                      <button
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                        onClick={handleSignup}
                      >
                        Kayıt Ol
                      </button>
                      {signupMessage && (
                        <h4 className="mt-3 text-green-500 text-sm">
                          {signupMessage}
                        </h4>
                      )}
                      {signupError && (
                        <h4 className="mt-3 text-red-500 text-sm">
                          {signupError}
                        </h4>
                      )}
                    </>
                  )
                ) : (
                  <button
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    onClick={() => router.push("/")}
                  >
                    Kayıt Olmak için Giriş Yapın
                  </button>
                )
              ) : (
                selectedEvent && (
                  <h3 className="text-red-500 text-md">
                    Bu etkinlik sona erdi.
                  </h3>
                )
              )}
              <DrawerClose asChild>
                <button className="w-full py-3 mt-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">
                  Kapat
                </button>
              </DrawerClose>
            </DrawerFooter>
          </motion.div>
        </DrawerContent>
      </Drawer>

      {/* Conditional Rendering for Loading and Error States */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="text-white text-2xl">Yükleniyor...</div>
        </div>
      )}
      {error && (
        <div className="fixed inset-0 bg-red-700 bg-opacity-80 flex justify-center items-center z-50">
          <div className="text-white text-2xl">Hata: {error.message}</div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </motion.div>
  );
}
