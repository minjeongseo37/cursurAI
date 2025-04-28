import React, { useState, useEffect, useRef } from "react";

// 날짜 유틸 함수
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}
function getWeekDates(year, month, day) {
  const date = new Date(year, month, day);
  const weekDay = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - weekDay);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const CATEGORIES = [
  { name: "일반", color: "#90caf9" },
  { name: "업무", color: "#a5d6a7" },
  { name: "개인", color: "#ffe082" },
  { name: "중요", color: "#ef9a9a" },
];

export default function Calendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [view, setView] = useState("month"); // "month" | "week" | "day"
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [events, setEvents] = useState({}); // { 'YYYY-MM-DD': [event, ...] }
  const [modal, setModal] = useState(null); // {date, idx, mode: "add"|"edit"}
  const [form, setForm] = useState({ text: "", time: "", repeat: "none", category: 0 });
  const notificationRefs = useRef({});

  // 알림 예약
  useEffect(() => {
    Object.values(notificationRefs.current).forEach(clearTimeout);
    notificationRefs.current = {};
    Object.entries(events).forEach(([date, evs]) => {
      evs.forEach((ev, idx) => {
        if (ev.time && ev.alarm) {
          const alarmDate = new Date(`${date}T${ev.time}`);
          alarmDate.setMinutes(alarmDate.getMinutes() - ev.alarm);
          const now = new Date();
          if (alarmDate > now) {
            const timeout = setTimeout(() => {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("일정 알림", { body: `${date} ${ev.time} - ${ev.text}` });
              } else {
                alert(`[알림] ${date} ${ev.time} - ${ev.text}`);
              }
            }, alarmDate - now);
            notificationRefs.current[`${date}-${idx}`] = timeout;
          }
        }
      });
    });
    return () => Object.values(notificationRefs.current).forEach(clearTimeout);
  }, [events]);

  // Notification 권한 요청
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 월 이동
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 일정 추가/수정/삭제
  const openModal = (date, idx = null, mode = "add") => {
    setModal({ date, idx, mode });
    if (mode === "edit" && idx !== null) {
      const ev = events[date][idx];
      setForm({
        text: ev.text,
        time: ev.time || "",
        repeat: ev.repeat || "none",
        category: ev.category || 0,
        alarm: ev.alarm || 0,
      });
    } else {
      setForm({ text: "", time: "", repeat: "none", category: 0, alarm: 0 });
    }
  };
  const closeModal = () => setModal(null);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleAddOrEdit = () => {
    if (!form.text.trim()) return;
    setEvents((prev) => {
      const key = modal.date;
      const updated = { ...prev };
      if (!updated[key]) updated[key] = [];
      const eventObj = {
        text: form.text,
        time: form.time,
        repeat: form.repeat,
        category: Number(form.category),
        alarm: Number(form.alarm),
      };
      if (modal.mode === "add") {
        updated[key].push(eventObj);
        // 반복 일정 처리
        if (form.repeat !== "none") {
          let d = new Date(modal.date);
          for (let i = 0; i < 11; i++) {
            if (form.repeat === "week") d.setDate(d.getDate() + 7);
            if (form.repeat === "month") d.setMonth(d.getMonth() + 1);
            const nextDate = formatDate(d);
            if (!updated[nextDate]) updated[nextDate] = [];
            updated[nextDate].push({ ...eventObj, repeat: "none" });
          }
        }
      } else if (modal.mode === "edit" && modal.idx !== null) {
        updated[key][modal.idx] = eventObj;
      }
      return updated;
    });
    closeModal();
  };

  const handleDelete = (date, idx) => {
    setEvents((prev) => {
      const updated = { ...prev };
      updated[date].splice(idx, 1);
      if (updated[date].length === 0) delete updated[date];
      return updated;
    });
    closeModal();
  };

  // 보기별 날짜 목록
  let datesToShow = [];
  if (view === "month") {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    for (let d = 1; d <= daysInMonth; d++) {
      datesToShow.push(formatDate(new Date(currentYear, currentMonth, d)));
    }
  } else if (view === "week") {
    const [y, m, d] = selectedDate.split("-").map(Number);
    datesToShow = getWeekDates(y, m - 1, d).map(formatDate);
  } else if (view === "day") {
    datesToShow = [selectedDate];
  }

  // 달력 렌더링
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(<td key={`empty-${i}`}></td>);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(new Date(currentYear, currentMonth, day));
    calendarCells.push(
      <td
        key={day}
        style={{
          border: "1px solid #ccc",
          padding: "8px",
          background: selectedDate === dateStr ? "#e0f7fa" : "#fff",
          cursor: "pointer",
          verticalAlign: "top",
        }}
        onClick={() => {
          setSelectedDate(dateStr);
          setView(view === "day" ? "day" : view); // 유지
        }}
      >
        <div style={{ fontWeight: "bold" }}>{day}</div>
        {events[dateStr] &&
          events[dateStr].map((ev, idx) => (
            <div
              key={idx}
              style={{
                background: CATEGORIES[ev.category]?.color,
                margin: "2px 0",
                padding: "2px 4px",
                borderRadius: 4,
                fontSize: "0.85em",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                openModal(dateStr, idx, "edit");
              }}
              title={ev.text}
            >
              {ev.time && <span>{ev.time} </span>}
              {ev.text}
            </div>
          ))}
        <button
          style={{ fontSize: "0.7em", marginTop: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            openModal(dateStr, null, "add");
          }}
        >
          +
        </button>
      </td>
    );
  }
  const rows = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    rows.push(<tr key={i}>{calendarCells.slice(i, i + 7)}</tr>);
  }

  // 주간/일간 일정 렌더링
  const renderEvents = (dateStr) =>
    events[dateStr]?.map((ev, idx) => (
      <div
        key={idx}
        style={{
          background: CATEGORIES[ev.category]?.color,
          margin: "4px 0",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: "1em",
          cursor: "pointer",
        }}
        onClick={() => openModal(dateStr, idx, "edit")}
        title={ev.text}
      >
        {ev.time && <span>{ev.time} </span>}
        {ev.text}
      </div>
    ));

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2>
        <button onClick={prevMonth}>◀</button>
        {currentYear}년 {currentMonth + 1}월
        <button onClick={nextMonth}>▶</button>
      </h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setView("month")}>월간</button>
        <button onClick={() => setView("week")}>주간</button>
        <button onClick={() => setView("day")}>일간</button>
      </div>
      {view === "month" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>일</th>
              <th>월</th>
              <th>화</th>
              <th>수</th>
              <th>목</th>
              <th>금</th>
              <th>토</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      )}
      {view !== "month" && (
        <div>
          <h4>
            {view === "week" ? "주간" : "일간"} 일정 (
            {view === "week"
              ? `${datesToShow[0]} ~ ${datesToShow[6]}`
              : selectedDate}
            )
          </h4>
          <div>
            {datesToShow.map((dateStr) => (
              <div key={dateStr} style={{ marginBottom: 8 }}>
                <b
                  style={{
                    cursor: "pointer",
                    textDecoration: selectedDate === dateStr ? "underline" : "none",
                  }}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setView("day");
                  }}
                >
                  {dateStr}
                </b>
                {renderEvents(dateStr)}
                <button
                  style={{ fontSize: "0.8em", marginLeft: 8 }}
                  onClick={() => openModal(dateStr, null, "add")}
                >
                  일정 추가
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 일정 추가/수정 모달 */}
      {modal && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              minWidth: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {modal.mode === "add" ? "일정 추가" : "일정 수정"} ({modal.date})
            </h3>
            <div>
              <input
                name="text"
                value={form.text}
                onChange={handleFormChange}
                placeholder="일정 내용"
                style={{ width: "100%", marginBottom: 8 }}
              />
              <div>
                <label>
                  시간:{" "}
                  <input
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleFormChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  반복:{" "}
                  <select name="repeat" value={form.repeat} onChange={handleFormChange}>
                    <option value="none">없음</option>
                    <option value="week">매주</option>
                    <option value="month">매월</option>
                  </select>
                </label>
              </div>
              <div>
                <label>
                  카테고리:{" "}
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                  >
                    {CATEGORIES.map((cat, i) => (
                      <option value={i} key={i}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  알림:{" "}
                  <select name="alarm" value={form.alarm} onChange={handleFormChange}>
                    <option value={0}>없음</option>
                    <option value={5}>5분 전</option>
                    <option value={10}>10분 전</option>
                    <option value={30}>30분 전</option>
                  </select>
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                <button onClick={handleAddOrEdit}>
                  {modal.mode === "add" ? "추가" : "수정"}
                </button>
                {modal.mode === "edit" && (
                  <button
                    style={{ marginLeft: 8, color: "red" }}
                    onClick={() => handleDelete(modal.date, modal.idx)}
                  >
                    삭제
                  </button>
                )}
                <button style={{ marginLeft: 8 }} onClick={closeModal}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 