"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase"; // Adjust the path as necessary
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Calendar from "../../components/Calendar"; // Adjust the import path based on your project structure

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // Selected event object
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState("upcoming"); // Default to 'upcoming'
  const [user, loading, error] = useAuthState(auth);
  const [signupMessage, setSignupMessage] = useState(null);
  const [signupError, setSignupError] = useState(null);

  const [hasSignedUp, setHasSignedUp] = useState(false);
  const router = useRouter();

  const drawerRef = useRef(null); // Reference to the drawer

  // Function to format date to YYYY-MM-DD for consistent comparison
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Effect to check if the user has already signed up for the selected event
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
      setSignupError("You must be logged in to sign up for an event.");
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

      if (!querySnapshot.empty) {
        setSignupMessage("You have already signed up for this event.");
        setHasSignedUp(true);
        return;
      }

      await addDoc(registrationsRef, {
        eventId: selectedEvent.id,
        userId: user.uid,
        signedUpAt: new Date(),
      });

      setSignupMessage("Successfully signed up for the event!");
      setHasSignedUp(true);
    } catch (error) {
      console.error("Error signing up for event:", error);
      setSignupError("There was an error signing up. Please try again.");
    }
  };

  // Effect to fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const eventsData = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort events by date (oldest to newest)
        eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (selectedEvent) {
      // Prevent scrolling
      document.body.classList.add("overflow-hidden");
    } else {
      // Re-enable scrolling
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedEvent]);

  // Memoize event dates for performance
  const eventDates = useMemo(() => {
    return new Set(events.map((event) => formatDate(event.date)));
  }, [events]);

  const getDayLabel = (date) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
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

  const isExpired = (eventDate) => new Date(eventDate) < new Date();

  // Handle date selection
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
      setSelectedDate(null); // Deselect if already selected
      setFilterStatus("upcoming"); // Reset filter to 'upcoming'
    } else {
      setSelectedDate(clickedDate);
      setFilterStatus(null); // Clear filterStatus when date is selected
    }
  };

  // Handle Upcoming | Past filter
  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setSelectedDate(null); // Clear selectedDate when changing filter
  };

  // Filter events based on selectedDate and filterStatus
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedDate) {
      const selectedDateStr = formatDate(selectedDate);
      filtered = filtered.filter(
        (event) => formatDate(event.date) === selectedDateStr
      );
    } else if (filterStatus === "upcoming") {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight
      filtered = filtered.filter((event) => new Date(event.date) >= today);
    } else if (filterStatus === "past") {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight
      filtered = filtered.filter((event) => new Date(event.date) < today);
    }

    return filtered;
  }, [events, selectedDate, filterStatus]);

  // Effect to handle clicks outside the drawer
  useEffect(() => {
    // Function to handle click events
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setSelectedEvent(null); // Close the drawer
      }
    };

    // If the drawer is open, add the event listener
    if (selectedEvent) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener when the drawer is closed
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedEvent]);

  return (
    <div className="font-sans bg-gradient-to-b from-[#0a0a19] to-black text-white min-h-screen flex flex-col items-center p-6">
      <header className="flex flex-col items-center mb-6">
        <h1 className="text-5xl font-bold mb-3">Events</h1>
        <p className="text-lg text-gray-400">
          Katılmak istediğiniz etkinlikleri keşfedin ve kaydolun!
        </p>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 justify-center w-full max-w-5xl">
        {/* Calendar */}
        <div className="w-full max-w-sm lg:w-1/3 lg:sticky lg:top-5 flex flex-col gap-4 lg:order-2 order-1 mx-auto">
          <Calendar
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDate={selectedDate}
            handleDateClick={handleDateClick}
            eventDates={eventDates}
          />

          {/* Upcoming | Past Filter - only show if no date is selected */}
          {!selectedDate && (
            <div className="flex justify-between mt-3">
              <button
                className={`flex-1 py-3 px-4 rounded bg-gray-700 text-gray-400 hover:bg-blue-500 hover:text-white transition-colors ${
                  filterStatus === "upcoming" ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => handleFilterChange("upcoming")}
              >
                Yaklaşan
              </button>
              <button
                className={`flex-1 py-3 px-4 rounded bg-gray-700 text-gray-400 hover:bg-blue-500 hover:text-white transition-colors ${
                  filterStatus === "past" ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => handleFilterChange("past")}
              >
                Geçmiş
              </button>
            </div>
          )}
        </div>

        {/* Event List */}
        <div className="relative flex-1 max-w-[900px] lg:order-1 order-2">
          <div className="absolute left-10 top-0 bottom-0 w-px bg-gray-600"></div>
          <div className="flex flex-col gap-6 ml-14">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start bg-gray-800 rounded-lg p-5 shadow-lg cursor-pointer relative hover:bg-gray-700 transition-colors"
                onClick={() => handleEventClick(event)}
              >
                {/* Timeline Marker */}
                <div className="absolute left-[-60px] top-6 flex flex-col items-center">
                  <div className="w-5 h-5 bg-blue-500 rounded-full z-10"></div>
                  {event !== filteredEvents[filteredEvents.length - 1] && (
                    <div className="w-px flex-1 bg-gray-600 mt-1"></div>
                  )}
                </div>

                {/* Event Content */}
                <div className="mr-6">
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-44 h-auto rounded"
                  />
                </div>
                <div className="flex flex-col w-full">
                  <h4 className="text-xl text-blue-400">
                    {getDayLabel(event.date)}
                  </h4>
                  <h3 className="mt-2 text-3xl">{event.name}</h3>
                  <p className="mt-1 text-lg text-gray-400">{event.time}</p>
                  <p className="mt-1 text-lg text-gray-400">{event.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Backdrop and Drawer */}
      {selectedEvent && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeDrawer}
          ></div>
          <div
            className="fixed top-0 right-0 w-96 h-full bg-gray-800 text-white p-6 shadow-lg overflow-y-auto z-50"
            ref={drawerRef}
          >
            <button
              className="absolute top-6 left-6 text-3xl font-bold hover:text-gray-400 transition-colors focus:outline-none"
              onClick={closeDrawer}
            >
              &times;
            </button>
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
            <img
              src={selectedEvent.imageUrl}
              alt={selectedEvent.name}
              className="w-full h-auto rounded mb-6"
            />
            <h2 className="text-3xl font-bold mb-3">{selectedEvent.name}</h2>
            <p className="text-lg text-gray-400 mb-2">
              {getDayLabel(selectedEvent.date)}, {selectedEvent.time}
            </p>
            <p className="text-lg text-gray-400 mb-5">
              {selectedEvent.location}
            </p>
            <p className="text-lg mb-6">{selectedEvent.description}</p>
            {!isExpired(selectedEvent.date) ? (
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
                      <p className="mt-3 text-green-500 text-sm">
                        {signupMessage}
                      </p>
                    )}
                    {signupError && (
                      <p className="mt-3 text-red-500 text-sm">{signupError}</p>
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
              <p className="text-red-500 text-md">Bu etkinlik sona erdi.</p>
            )}
          </div>
        </>
      )}

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
    </div>
  );
}
