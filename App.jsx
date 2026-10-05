import { useEffect, useRef, useState } from "react";
import { fetchUsers } from "./api";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [meetings, setMeetings] = useState(() => {
    const saved = localStorage.getItem("connectx_meetings");

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "CX-48291",
            title: "Frontend Interview",
            date: "Today",
            time: "07:30 PM",
            host: "You",
            status: "Upcoming",
          },
          {
            id: "CX-72841",
            title: "Project Discussion",
            date: "Tomorrow",
            time: "11:00 AM",
            host: "You",
            status: "Upcoming",
          },
        ];
  });

  const [currentMeeting, setCurrentMeeting] = useState(null);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");

  const [joinId, setJoinId] = useState("");

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      user: "System",
      text: "Welcome to the ConnectX meeting.",
    },
  ]);

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [notification, setNotification] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadUsers();

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "connectx_meetings",
      JSON.stringify(meetings)
    );
  }, [meetings]);

  async function loadUsers() {
    setLoadingUsers(true);

    const data = await fetchUsers();

    setUsers(data);
    setLoadingUsers(false);
  }

  function showNotification(text) {
    setNotification(text);

    setTimeout(() => {
      setNotification("");
    }, 2500);
  }

  function generateMeetingId() {
    return `CX-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  function createMeeting(event) {
    event.preventDefault();

    if (!meetingTitle || !meetingDate || !meetingTime) {
      showNotification("Please fill all meeting details.");
      return;
    }

    const newMeeting = {
      id: generateMeetingId(),
      title: meetingTitle,
      date: meetingDate,
      time: meetingTime,
      host: "You",
      status: "Upcoming",
    };

    setMeetings((prev) => [newMeeting, ...prev]);

    setMeetingTitle("");
    setMeetingDate("");
    setMeetingTime("");

    showNotification("Meeting created successfully!");

    setActivePage("meetings");
  }

  function joinMeeting(event) {
    event.preventDefault();

    if (!joinId.trim()) {
      showNotification("Enter a meeting ID.");
      return;
    }

    const meeting = meetings.find(
      (item) => item.id.toLowerCase() === joinId.trim().toLowerCase()
    );

    if (meeting) {
      setCurrentMeeting(meeting);
    } else {
      setCurrentMeeting({
        id: joinId.trim().toUpperCase(),
        title: "Instant Meeting",
        date: "Now",
        time: "Live",
        host: "Guest",
        status: "Live",
      });
    }

    setActivePage("meeting");
    setJoinId("");

    showNotification("Joined meeting!");
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
      setMicOn(true);
    } catch (error) {
      console.error(error);

      showNotification(
        "Camera permission denied or camera unavailable."
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  }

  function toggleCamera() {
    if (!cameraOn) {
      startCamera();
      return;
    }

    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];

      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  }

  function toggleMic() {
    if (!streamRef.current) {
      setMicOn((prev) => !prev);
      return;
    }

    const audioTrack = streamRef.current.getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  }

  async function toggleScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      showNotification("Screen sharing is not supported.");
      return;
    }

    try {
      if (!screenSharing) {
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        setScreenSharing(true);
        showNotification("Screen sharing started.");
      } else {
        setScreenSharing(false);
        showNotification("Screen sharing stopped.");
      }
    } catch (error) {
      console.log("Screen sharing cancelled.");
    }
  }

  function leaveMeeting() {
    stopCamera();

    setScreenSharing(false);
    setCurrentMeeting(null);
    setActivePage("dashboard");

    showNotification("You left the meeting.");
  }

  function sendMessage(event) {
    event.preventDefault();

    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      user: "You",
      text: message.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);

    setMessage("");
  }

  function deleteMeeting(id) {
    setMeetings((prev) =>
      prev.filter((meeting) => meeting.id !== id)
    );

    showNotification("Meeting removed.");
  }

  const filteredUsers = users.filter((user) => {
    const fullName =
      `${user.firstName} ${user.lastName}`.toLowerCase();

    return fullName.includes(search.toLowerCase());
  });

  const upcomingCount = meetings.length;

  function renderPage() {
    if (activePage === "dashboard") {
      return (
        <Dashboard
          meetings={meetings}
          upcomingCount={upcomingCount}
          users={users}
          onCreate={() => setActivePage("create")}
          onJoin={() => setActivePage("join")}
          onMeeting={(meeting) => {
            setCurrentMeeting(meeting);
            setActivePage("meeting");
          }}
        />
      );
    }

    if (activePage === "create") {
      return (
        <CreateMeeting
          title={meetingTitle}
          setTitle={setMeetingTitle}
          date={meetingDate}
          setDate={setMeetingDate}
          time={meetingTime}
          setTime={setMeetingTime}
          onSubmit={createMeeting}
        />
      );
    }

    if (activePage === "join") {
      return (
        <JoinMeeting
          joinId={joinId}
          setJoinId={setJoinId}
          onSubmit={joinMeeting}
        />
      );
    }

    if (activePage === "meetings") {
      return (
        <Meetings
          meetings={meetings}
          onJoin={(meeting) => {
            setCurrentMeeting(meeting);
            setActivePage("meeting");
          }}
          onDelete={deleteMeeting}
        />
      );
    }

    if (activePage === "people") {
      return (
        <People
          users={filteredUsers}
          loading={loadingUsers}
          search={search}
          setSearch={setSearch}
          refresh={loadUsers}
        />
      );
    }

    if (activePage === "meeting") {
      return (
        <MeetingRoom
          meeting={currentMeeting}
          videoRef={videoRef}
          cameraOn={cameraOn}
          micOn={micOn}
          screenSharing={screenSharing}
          toggleCamera={toggleCamera}
          toggleMic={toggleMic}
          toggleScreenShare={toggleScreenShare}
          leaveMeeting={leaveMeeting}
          messages={messages}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      );
    }

    return null;
  }

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">CONNECTX WORKSPACE</p>
            <h1>
              {activePage === "meeting"
                ? "Live Meeting"
                : "Welcome back 👋"}
            </h1>
          </div>

          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={() => showNotification("No new notifications")}
            >
              🔔
            </button>

            <div className="profile">
              <div className="avatar">C</div>

              <div>
                <strong>Chanchal</strong>
                <span>Frontend Developer</span>
              </div>
            </div>
          </div>
        </header>

        {notification && (
          <div className="toast">
            <span>✓</span>
            {notification}
          </div>
        )}

        <section className="content">
          {renderPage()}
        </section>
      </main>
    </div>
  );
}

/* ================= SIDEBAR ================= */

function Sidebar({ activePage, setActivePage }) {
  const items = [
    ["dashboard", "⌂", "Dashboard"],
    ["meetings", "▣", "My Meetings"],
    ["people", "♙", "People"],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">C</div>

        <div>
          <strong>ConnectX</strong>
          <span>Meet smarter</span>
        </div>
      </div>

      <div className="nav-title">WORKSPACE</div>

      <nav>
        {items.map(([id, icon, label]) => (
          <button
            key={id}
            className={`nav-item ${
              activePage === id ? "active" : ""
            }`}
            onClick={() => setActivePage(id)}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      <div className="quick-box">
        <span>QUICK ACTION</span>

        <button
          onClick={() => setActivePage("create")}
        >
          ＋ Create Meeting
        </button>

        <button
          onClick={() => setActivePage("join")}
        >
          ↗ Join Meeting
        </button>
      </div>

      <div className="sidebar-bottom">
        <div className="status-dot"></div>

        <div>
          <strong>System Online</strong>
          <span>All services operational</span>
        </div>
      </div>
    </aside>
  );
}

/* ================= DASHBOARD ================= */

function Dashboard({
  meetings,
  upcomingCount,
  users,
  onCreate,
  onJoin,
  onMeeting,
}) {
  return (
    <div className="page">
      <div className="hero">
        <div>
          <span className="hero-label">YOUR DIGITAL MEETING SPACE</span>

          <h2>
            Connect.
            <br />
            Collaborate.
            <br />
            <em>Anywhere.</em>
          </h2>

          <p>
            Host meetings, collaborate with your team and stay
            connected from one simple workspace.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={onCreate}>
              ＋ Create Meeting
            </button>

            <button className="secondary-btn" onClick={onJoin}>
              Join with ID →
            </button>
          </div>
        </div>

        <div className="hero-orbit">
          <div className="orbit-ring"></div>
          <div className="orbit-ring ring-two"></div>

          <div className="orbit-card main-orbit">
            <span>LIVE</span>
            <strong>ConnectX</strong>
            <small>Video Workspace</small>
          </div>

          <div className="floating-person p1">👨🏻</div>
          <div className="floating-person p2">👩🏻</div>
          <div className="floating-person p3">👨🏽</div>
        </div>
      </div>

      <div className="stats-grid">
        <Stat
          icon="◷"
          number={upcomingCount}
          label="Upcoming Meetings"
        />

        <Stat
          icon="♙"
          number={users.length || 0}
          label="API Users"
        />

        <Stat
          icon="◉"
          number="24"
          label="Hours Connected"
        />

        <Stat
          icon="✦"
          number="98%"
          label="Workspace Health"
        />
      </div>

      <div className="section-header">
        <div>
          <span className="eyebrow">YOUR SCHEDULE</span>
          <h3>Upcoming meetings</h3>
        </div>

        <button
          className="text-btn"
          onClick={() => onMeeting(meetings[0])}
          disabled={!meetings.length}
        >
          View all →
        </button>
      </div>

      <div className="meeting-list">
        {meetings.slice(0, 3).map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onJoin={() => onMeeting(meeting)}
          />
        ))}

        {!meetings.length && (
          <div className="empty">
            No meetings scheduled yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, number, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <strong>{number}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function MeetingCard({ meeting, onJoin }) {
  return (
    <div className="meeting-card">
      <div className="meeting-date">
        <strong>{meeting.date}</strong>
        <span>{meeting.time}</span>
      </div>

      <div className="meeting-info">
        <span className="meeting-type">VIDEO MEETING</span>
        <h4>{meeting.title}</h4>
        <p>
          Meeting ID: <b>{meeting.id}</b>
        </p>
      </div>

      <div className="meeting-host">
        <div className="mini-avatar">C</div>
        <span>Hosted by {meeting.host}</span>
      </div>

      <button className="join-small" onClick={onJoin}>
        Join →
      </button>
    </div>
  );
}

/* ================= CREATE ================= */

function CreateMeeting({
  title,
  setTitle,
  date,
  setDate,
  time,
  setTime,
  onSubmit,
}) {
  return (
    <div className="page narrow-page">
      <div className="page-heading">
        <span className="eyebrow">NEW SESSION</span>
        <h2>Create a meeting</h2>
        <p>
          Schedule your next meeting in a few simple steps.
        </p>
      </div>

      <form className="form-card" onSubmit={onSubmit}>
        <div className="form-icon">✦</div>

        <label>Meeting title</label>

        <input
          type="text"
          placeholder="e.g. Frontend Interview"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="two-inputs">
          <div>
            <label>Date</label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label>Time</label>

            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="feature-preview">
          <div>🎥 HD Video</div>
          <div>🎙 Audio</div>
          <div>💬 Chat</div>
          <div>🖥 Screen Share</div>
        </div>

        <button className="primary-btn full-btn">
          Create Meeting →
        </button>
      </form>
    </div>
  );
}

/* ================= JOIN ================= */

function JoinMeeting({ joinId, setJoinId, onSubmit }) {
  return (
    <div className="page narrow-page">
      <div className="join-hero">
        <div className="join-circle">↗</div>

        <span className="eyebrow">QUICK ACCESS</span>

        <h2>Join a meeting</h2>

        <p>
          Enter the meeting ID shared by your host.
        </p>

        <form onSubmit={onSubmit}>
          <input
            className="meeting-id-input"
            placeholder="CX-12345"
            value={joinId}
            onChange={(e) =>
              setJoinId(e.target.value.toUpperCase())
            }
          />

          <button className="primary-btn full-btn">
            Join Meeting →
          </button>
        </form>

        <div className="tip">
          💡 Try <strong>CX-48291</strong> to join the demo meeting.
        </div>
      </div>
    </div>
  );
}

/* ================= MEETINGS ================= */

function Meetings({ meetings, onJoin, onDelete }) {
  return (
    <div className="page">
      <div className="page-heading inline-heading">
        <div>
          <span className="eyebrow">SCHEDULE</span>
          <h2>My Meetings</h2>
        </div>
      </div>

      <div className="meeting-list big-list">
        {meetings.map((meeting) => (
          <div className="meeting-row" key={meeting.id}>
            <div className="calendar-icon">▣</div>

            <div className="meeting-info">
              <span className="meeting-type">
                {meeting.status}
              </span>

              <h4>{meeting.title}</h4>

              <p>
                {meeting.date} · {meeting.time} ·{" "}
                {meeting.id}
              </p>
            </div>

            <button
              className="join-small"
              onClick={() => onJoin(meeting)}
            >
              Join
            </button>

            <button
              className="delete-btn"
              onClick={() => onDelete(meeting.id)}
            >
              ×
            </button>
          </div>
        ))}

        {!meetings.length && (
          <div className="empty">
            No meetings available.
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= PEOPLE / API ================= */

function People({
  users,
  loading,
  search,
  setSearch,
  refresh,
}) {
  return (
    <div className="page">
      <div className="page-heading">
        <span className="eyebrow">API DIRECTORY</span>
        <h2>People</h2>
        <p>
          User profiles loaded directly from a public REST API.
        </p>
      </div>

      <div className="api-toolbar">
        <input
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="secondary-btn"
          onClick={refresh}
        >
          ↻ Refresh API
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loader"></div>
          Loading users from API...
        </div>
      ) : (
        <div className="people-grid">
          {users.map((user) => (
            <div className="person-card" key={user.id}>
              <img
                src={user.image}
                alt={`${user.firstName} ${user.lastName}`}
              />

              <div>
                <h4>
                  {user.firstName} {user.lastName}
                </h4>

                <p>{user.email}</p>

                <span>
                  {user.company?.title || "Team Member"}
                </span>
              </div>

              <button
                onClick={() =>
                  alert(
                    `${user.firstName} ${user.lastName} profile selected`
                  )
                }
              >
                →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= MEETING ROOM ================= */

function MeetingRoom({
  meeting,
  videoRef,
  cameraOn,
  micOn,
  screenSharing,
  toggleCamera,
  toggleMic,
  toggleScreenShare,
  leaveMeeting,
  messages,
  message,
  setMessage,
  sendMessage,
}) {
  if (!meeting) {
    return (
      <div className="empty">
        No active meeting.
      </div>
    );
  }

  return (
    <div className="meeting-room">
      <div className="meeting-room-top">
        <div>
          <span className="live-badge">
            <span></span> LIVE
          </span>

          <h2>{meeting.title}</h2>

          <p>
            Meeting ID: <strong>{meeting.id}</strong>
          </p>
        </div>

        <div className="room-time">
          <span>Connected</span>
          <strong>00:18:42</strong>
        </div>
      </div>

      <div className="video-layout">
        <div className="video-area">
          <div className="video-grid">
            <div className="video-box local-video">
              {cameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                ></video>
              ) : (
                <div className="camera-off">
                  <div className="large-avatar">C</div>
                  <span>Camera is off</span>
                </div>
              )}

              <div className="video-name">
                <span>You</span>

                <b>{micOn ? "🎙" : "🔇"}</b>
              </div>
            </div>

            <div className="video-box">
              <div className="fake-participant">
                <div className="large-avatar purple">A</div>
                <strong>Alex Morgan</strong>
                <span>Frontend Developer</span>
              </div>

              <div className="video-name">
                <span>Alex Morgan</span>
                <b>🎙</b>
              </div>
            </div>

            <div className="video-box">
              <div className="fake-participant">
                <div className="large-avatar orange">S</div>
                <strong>Sarah Khan</strong>
                <span>Product Designer</span>
              </div>

              <div className="video-name">
                <span>Sarah Khan</span>
                <b>🎙</b>
              </div>
            </div>

            <div className="video-box add-person">
              <div>
                <span>＋</span>
                <p>Invite participant</p>
              </div>
            </div>
          </div>

          <div className="room-controls">
            <button
              className={micOn ? "control-btn" : "control-btn off"}
              onClick={toggleMic}
            >
              {micOn ? "🎙" : "🔇"}
            </button>

            <button
              className={
                cameraOn
                  ? "control-btn"
                  : "control-btn off"
              }
              onClick={toggleCamera}
            >
              {cameraOn ? "▣" : "▣"}
            </button>

            <button
              className={
                screenSharing
                  ? "control-btn active-control"
                  : "control-btn"
              }
              onClick={toggleScreenShare}
            >
              🖥
            </button>

            <button
              className="control-btn"
              onClick={() =>
                alert("More options coming soon.")
              }
            >
              ⋯
            </button>

            <button
              className="leave-btn"
              onClick={leaveMeeting}
            >
              ☎ Leave
            </button>
          </div>
        </div>

        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <strong>Meeting Chat</strong>
              <span>3 participants</span>
            </div>

            <button>×</button>
          </div>

          <div className="messages">
            {messages.map((item) => (
              <div
                className={`message ${
                  item.user === "You" ? "own" : ""
                }`}
                key={item.id}
              >
                <div className="message-avatar">
                  {item.user === "You"
                    ? "C"
                    : item.user.charAt(0)}
                </div>

                <div>
                  <strong>{item.user}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form
            className="chat-input"
            onSubmit={sendMessage}
          >
            <input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button>➤</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;