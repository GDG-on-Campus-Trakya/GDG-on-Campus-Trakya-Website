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
import { useState, useEffect, useMemo, useRef, Suspense } from "react";
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

function SearchParamsHandler({ onQRCodeRedirect, events }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const handleQRCodeRedirect = async () => {
      const qrCodeId = searchParams.get("qrCode");

      if (qrCodeId && events.length > 0) {
        onQRCodeRedirect(qrCodeId);
      }
    };

    if (events.length > 0) {
      handleQRCodeRedirect();
    }
  }, [searchParams, events, onQRCodeRedirect]);

  return null;
}

function EventsPageContent() {
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [filterStatus, setFilterStatus] = useState("upcoming");
  const [user, loading, error] = useAuthState(auth);
  const [signupMessage, setSignupMessage] = useState(null);
  const [signupError, setSignupError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageCache, setImageCache] = useState(new Map());
  const router = useRouter();

  // Initialize client-side only state after hydration
  useEffect(() => {
    setIsClient(true);
    setCurrentMonth(new Date());
  }, []);

  // Advanced image loading with caching and optimization
  const loadImageOptimized = (imageUrl, isMobile = false) => {
    return new Promise((resolve) => {
      // Check cache first
      if (imageCache.has(imageUrl)) {
        resolve(true);
        return;
      }

      const img = new Image();

      // Aggressive timeout for mobile
      const timeout = setTimeout(() => {
        resolve(false); // Timeout, but don't block UI
      }, isMobile ? 150 : 500);

      img.onload = () => {
        clearTimeout(timeout);
        // Cache the loaded image
        setImageCache(prev => new Map(prev.set(imageUrl, true)));
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      // Start loading
      img.src = imageUrl;
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isExpired = (eventDate, eventTime) => {
    if (!isClient) return false; // Return false during SSR to avoid hydration mismatch
    const now = new Date();
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(hours, minutes, 0, 0);
    return now > eventDateTime;
  };

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

  const handleQRCodeRedirect = async (qrCodeId) => {
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
          setSponsors([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set empty arrays to prevent undefined errors
        setEvents([]);
        setSponsors([]);
      }
    };

    fetchData();
  }, []);


  // Memoize event dates for performance (ilk defa memo kullandım)
  const eventDates = useMemo(() => {
    return new Set(events.map((event) => formatDate(event.date)));
  }, [events]);

  const getDayLabel = (date) => {
    if (!isClient) {
      // Return a safe fallback during SSR
      const eventDate = new Date(date);
      return eventDate.toLocaleDateString("tr-TR", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
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

  const handleEventClick = async (event) => {
    setDrawerLoading(true);
    setImageLoaded(false);
    setSelectedEvent(event);

    // Mobile-optimized loading strategy
    const isMobile = isClient ? window.innerWidth <= 768 : false;

    if (event.imageUrl) {
      // Use optimized image loading
      const loaded = await loadImageOptimized(event.imageUrl, isMobile);
      setImageLoaded(true);
      setDrawerLoading(false);
    } else {
      // No image, open immediately
      setImageLoaded(true);
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelectedEvent(null);
    // Clear QR code parameter from URL when closing drawer
    if (isClient) {
      const url = new URL(window.location);
      if (url.searchParams.has('qrCode')) {
        url.searchParams.delete('qrCode');
        window.history.replaceState(null, '', url.toString());
      }
    }
    // Force cleanup of any potential body style issues - more aggressive for mobile
    if (isClient) {
      setTimeout(() => {
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('overflow-x');
        document.body.style.removeProperty('overflow-y');
        document.body.style.removeProperty('pointer-events');
        document.body.style.removeProperty('touch-action');
        document.body.classList.remove('overflow-hidden');
        document.documentElement.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('touch-action');
        // Re-enable touch scrolling
        document.body.style.touchAction = 'auto';
        document.documentElement.style.touchAction = 'auto';
      }, 100);
    }
  };

  const showPreviousEvent = async () => {
    if (!selectedEvent) return;
    const currentIndex = filteredEvents.findIndex(
      (event) => event.id === selectedEvent.id
    );
    const previousIndex =
      (currentIndex - 1 + filteredEvents.length) % filteredEvents.length;
    const previousEvent = filteredEvents[previousIndex];

    setDrawerLoading(true);
    setImageLoaded(false);
    setSelectedEvent(previousEvent);

    const isMobile = isClient ? window.innerWidth <= 768 : false;

    if (previousEvent.imageUrl) {
      // Use optimized image loading with even faster timeouts for navigation
      await loadImageOptimized(previousEvent.imageUrl, isMobile);
      setImageLoaded(true);
      setDrawerLoading(false);
    } else {
      setImageLoaded(true);
      setDrawerLoading(false);
    }
  };

  const showNextEvent = async () => {
    if (!selectedEvent) return;
    const currentIndex = filteredEvents.findIndex(
      (event) => event.id === selectedEvent.id
    );
    const nextIndex = (currentIndex + 1) % filteredEvents.length;
    const nextEvent = filteredEvents[nextIndex];

    setDrawerLoading(true);
    setImageLoaded(false);
    setSelectedEvent(nextEvent);

    const isMobile = isClient ? window.innerWidth <= 768 : false;

    if (nextEvent.imageUrl) {
      // Use optimized image loading
      await loadImageOptimized(nextEvent.imageUrl, isMobile);
      setImageLoaded(true);
      setDrawerLoading(false);
    } else {
      setImageLoaded(true);
      setDrawerLoading(false);
    }
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
      if (!isClient) {
        // During SSR, show all events to avoid hydration mismatch
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      } else {
        const now = new Date();
        filtered = filtered.filter((event) => {
          const [hours, minutes] = event.time.split(':').map(Number);
          const eventDateTime = new Date(event.date);
          eventDateTime.setHours(hours, minutes, 0, 0);
          return eventDateTime >= now;
        });
        // Sort upcoming events from oldest to newest
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    } else if (filterStatus === "past") {
      if (!isClient) {
        // During SSR, show no past events to avoid hydration mismatch
        filtered = [];
      } else {
        const now = new Date();
        filtered = filtered.filter((event) => {
          const [hours, minutes] = event.time.split(':').map(Number);
          const eventDateTime = new Date(event.date);
          eventDateTime.setHours(hours, minutes, 0, 0);
          return eventDateTime < now;
        });
        // Sort past events from newest to oldest
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    }

    return filtered;
  }, [events, selectedDate, filterStatus, isClient]);


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

      <Suspense fallback={null}>
        <SearchParamsHandler onQRCodeRedirect={handleQRCodeRedirect} events={events} />
      </Suspense>

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
            {currentMonth && (
              <Calendar
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                handleDateClick={handleDateClick}
                eventDates={eventDates}
              />
            )}
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
                    const status = isExpired(event.date, event.time)
                      ? "Geçmiş"
                      : "Yaklaşan";
                    const statusColor =
                      status === "Yaklaşan" ? "bg-green-600" : "bg-red-600";

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        transition={{
                          delay: index * 0.05, // Reduced delay
                          duration: 0.3, // Reduced duration
                          ease: "easeOut",
                        }}
                        whileHover={{
                          scale: 1.01, // Reduced scale
                          transition: { duration: 0.1 }, // Faster transition
                        }}
                        className="flex items-start bg-gray-800 rounded-lg p-5 shadow-lg cursor-pointer relative hover:bg-gray-700 transition-all active:scale-95"
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
                            loading="lazy"
                            decoding="async"
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

      {/* Responsive Drawer - Bottom on mobile, Right on desktop */}
      <Drawer
        open={!!selectedEvent}
        onOpenChange={(open) => !open && closeDrawer()}
      >
        <DrawerContent className="md:top-0 md:right-0 md:left-auto md:bottom-0 md:h-screen md:w-[400px] md:rounded-none md:border-l
                                   max-md:inset-x-0 max-md:bottom-0 max-md:h-[85vh] max-md:rounded-t-[10px] max-md:border-t
                                   bg-[#0a0a19] text-white border-gray-600">
          <div className="h-full p-6 overflow-y-auto touch-pan-y overscroll-contain
                          md:scrollbar-thin md:scrollbar-thumb-gray-600 md:scrollbar-track-transparent">
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
                  {/* Simple Fast Image */}
                  <div className="w-full mb-6">
                    <img
                      src={selectedEvent.imageUrl}
                      alt={selectedEvent.name}
                      className="w-full h-auto rounded select-none pointer-events-none"
                      draggable="false"
                      loading="eager"
                      decoding="async"
                    />
                  </div>

                  {/* Title - Always present for accessibility */}
                  <DrawerTitle className="text-3xl font-bold mb-3">
                    {drawerLoading ? "Yükleniyor..." : selectedEvent.name}
                  </DrawerTitle>

                  {/* Content Loading State */}
                  {drawerLoading && (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  )}

                  {/* Wrap content in DrawerDescription for accessibility */}
                  <DrawerDescription asChild>
                    {drawerLoading ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-700 rounded w-4/5"></div>
                        <div className="space-y-2 mt-4">
                          <div className="h-3 bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        </div>
                      </div>
                    ) : (
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
                    )}
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
                                loading="lazy"
                                decoding="async"
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
              {selectedEvent && !isExpired(selectedEvent.date, selectedEvent.time) ? (
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
          </div>
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

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="font-sans bg-gradient-to-b from-[#0a0a19] to-black text-white min-h-screen flex items-center justify-center">
      <div className="text-2xl">Loading...</div>
    </div>}>
      <EventsPageContent />
    </Suspense>
  );
}
