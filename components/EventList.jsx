import React from "react";

const EventList = ({ registrations, events }) => {
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

        const signedUpDate = new Date(
          registration.signedUpAt.seconds * 1000
        ).toLocaleDateString("en-US");

        return (
          <li
            key={registration.id}
            className="flex items-center bg-gray-800 p-5 rounded-lg shadow-md"
          >
            <img
              src={event.imageUrl || "/default-event.png"}
              alt={event.name}
              className="w-20 h-20 rounded-lg object-cover mr-5"
            />
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold text-white">{event.name}</h3>
              <p className="text-gray-400 text-sm">
                Kayıt Tarihi: {signedUpDate}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default EventList;
