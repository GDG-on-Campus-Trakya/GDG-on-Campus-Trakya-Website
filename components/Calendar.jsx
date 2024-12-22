import React from "react";
// components/Calendar.jsx

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Calendar = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  handleDateClick,
  eventDates,
}) => {
  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const weeks = [];
  let week = [];

  for (let i = 0; i < firstDay; i++) {
    week.push({
      day: daysInPrevMonth - firstDay + i + 1,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    week.push({ day, isCurrentMonth: true });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  let nextMonthDay = 1;
  while (week.length < 7) {
    week.push({ day: nextMonthDay++, isCurrentMonth: false });
  }
  weeks.push(week);

  while (weeks.length < 6) {
    const extraWeek = [];
    for (let i = 0; i < 7; i++) {
      extraWeek.push({ day: nextMonthDay++, isCurrentMonth: false });
    }
    weeks.push(extraWeek);
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <button
          className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
          onClick={handlePrevMonth}
        >
          &lt;
        </button>
        <h3 className="text-lg text-white">
          {currentMonth.toLocaleString("tr-TR", { month: "long" })} {year}
        </h3>
        <button
          className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
          onClick={handleNextMonth}
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Pzr", "Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt"].map((day) => (
          <div key={day} className="text-center text-sm text-gray-400">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((dateObj, dayIndex) => {
              const { day, isCurrentMonth } = dateObj;

              const displayMonth = isCurrentMonth
                ? month
                : day < 15
                ? month + 1
                : month - 1;
              const displayYear =
                displayMonth < 0
                  ? year - 1
                  : displayMonth > 11
                  ? year + 1
                  : year;

              const adjustedMonth = (displayMonth + 12) % 12;
              const date = new Date(displayYear, adjustedMonth, day);
              const dateStr = formatDate(date);
              const hasEvent = eventDates.has(dateStr);
              const isSelected =
                selectedDate &&
                date.toDateString() === selectedDate.toDateString();

              const isClickable = isCurrentMonth && hasEvent;

              return (
                <div
                  key={dayIndex}
                  className={`flex items-center justify-center w-10 h-10 rounded cursor-pointer text-sm ${
                    hasEvent && isCurrentMonth ? "bg-blue-500 text-white" : ""
                  } ${isSelected ? "border-2 border-white" : ""} ${
                    !isCurrentMonth
                      ? "text-gray-500  cursor-default"
                      : "text-white"
                  } ${isClickable ? "hover:bg-blue-600" : "cursor-default"}`}
                  onClick={() => isClickable && handleDateClick(day)}
                >
                  {day}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
