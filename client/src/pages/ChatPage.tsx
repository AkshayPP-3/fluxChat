import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = "dark" | "light";
type Panel = "global" | "friends" | "profile";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  avatarUrl?: string;
  online: boolean;
}

interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  timestamp: Date;
}

interface EditForm {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDayLabel(date: Date): string {
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date); d.setHours(0,0,0,0);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function groupByDay(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  let lastLabel = "";
  for (const msg of messages) {
    const label = formatDayLabel(msg.timestamp);
    if (label !== lastLabel) { groups.push({ label, messages: [] }); lastLabel = label; }
    groups[groups.length - 1].messages.push(msg);
  }
  return groups;
}

function getUser(id: string, registeredUsers: User[]): User {
  const allUsers = registeredUsers;
  const found = allUsers.find(u => u.id === id);
  if (found) return found;
  // Fallback for current user if not in list
  return { id, firstName: "User", lastName: "", username: "@user", avatar: "U", online: true };
}

function avatarColors(str: string): string {
  const colors = ["#6366f1","#06b6d4","#f59e0b","#10b981","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
  let hash = 0; for (const c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  dark: {
    bg:         "#0d0f17",
    surface:    "#13151f",
    surfaceAlt: "#1a1d2e",
    border:     "rgba(255,255,255,0.07)",
    text:       "#e2e8f0",
    textMuted:  "rgba(148,163,184,0.65)",
    textDim:    "rgba(100,116,139,0.7)",
    input:      "rgba(255,255,255,0.05)",
    inputBorder:"rgba(99,102,241,0.3)",
    accent:     "#6366f1",
    accentSoft: "rgba(99,102,241,0.15)",
    msgMe:      "linear-gradient(135deg,#6366f1,#818cf8)",
    msgOther:   "#1e2132",
    msgOtherBorder: "rgba(255,255,255,0.06)",
    hover:      "rgba(255,255,255,0.04)",
    hoverStrong:"rgba(99,102,241,0.1)",
    scrollbar:  "rgba(99,102,241,0.2)",
    danger:     "#ef4444",
    online:     "#22c55e",
    offline:    "#94a3b8",
  },
  light: {
    bg:         "#f0f2f8",
    surface:    "#ffffff",
    surfaceAlt: "#f8f9fe",
    border:     "rgba(0,0,0,0.08)",
    text:       "#1e2030",
    textMuted:  "rgba(71,85,105,0.8)",
    textDim:    "rgba(100,116,139,0.7)",
    input:      "rgba(0,0,0,0.03)",
    inputBorder:"rgba(99,102,241,0.35)",
    accent:     "#6366f1",
    accentSoft: "rgba(99,102,241,0.1)",
    msgMe:      "linear-gradient(135deg,#6366f1,#818cf8)",
    msgOther:   "#ffffff",
    msgOtherBorder: "rgba(0,0,0,0.08)",
    hover:      "rgba(0,0,0,0.03)",
    hoverStrong:"rgba(99,102,241,0.08)",
    scrollbar:  "rgba(99,102,241,0.25)",
    danger:     "#ef4444",
    online:     "#22c55e",
    offline:    "#94a3b8",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatLayout() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme]       = useState<Theme>("dark");
  const [panel, setPanel]       = useState<Panel>("global");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentConversation, setCurrentConversation] = useState<{ id: string; name: string } | null>({ id: "global_room", name: "Global Chat" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [userConversations, setUserConversations] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft]       = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile]   = useState({
    id: user?.id || "",
    firstName: user?.firstname || "",
    lastName: user?.lastname || "",
    username: user?.username || "",
    avatar: user?.firstname?.[0] || "",
    avatarUrl: user?.avatarUrl || "",
    online: true
  });
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: user?.firstname || "",
    lastName: user?.lastname || "",
    username: user?.username || "",
    password: ""
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tk = T[theme];
  const isDark = theme === "dark";

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch users
  useEffect(() => {
    if (token) {
      console.log("Fetching users with token:", token);
      fetch("http://localhost:3000/api/user", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then(data => {
        console.log("Fetched users:", data);
        if (Array.isArray(data)) {
          const formattedUsers = data.map((u: any) => ({
            id: u.id,
            firstName: u.firstname,
            lastName: u.lastname,
            username: u.username,
            avatar: u.firstname?.[0] || "",
            avatarUrl: u.avatarUrl,
            online: true
          }));
          setRegisteredUsers(formattedUsers);
        }
      })
      .catch(err => console.error("Error fetching users:", err));

      // Fetch global chat messages OR private chat messages
      const convoId = currentConversation?.id === "global_room" ? "general_global" : currentConversation?.id;
      if (convoId) {
        fetch(`http://localhost:3000/api/messages/${convoId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formattedMsgs = data.map((m: any) => ({
              id: m.id,
              senderId: m.senderId,
              text: m.content || "",
              imageUrl: m.imageUrl,
              timestamp: new Date(m.createdAt)
            }));
            setMessages(formattedMsgs);
          }
        })
        .catch(err => console.error("Error fetching messages:", err));
      }

      // Fetch user's conversations (for friends list)
      fetch("http://localhost:3000/api/conversations", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUserConversations(data);
        }
      })
      .catch(err => console.error("Error fetching conversations:", err));
    }
  }, [token, currentConversation]);

  // Socket setup for global chat
  useEffect(() => {
    if (token && user) {
      const socket = io("http://localhost:3000", {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        socket.emit("user_online", user.id);
      });

      socket.on("update_online_users", (userIds: string[]) => {
        setOnlineUsers(userIds);
      });

      socket.on("receive_message", (data) => {
        console.log("Socket - Received message:", data);
        
        // Use a functional update to get the LATEST currentConversation state
        setCurrentConversation(curr => {
          const isMatch = data.conversationId === curr?.id || 
                        (data.conversationId === "global_room" && curr?.id === "global_room") ||
                        (data.conversationId === "general_global" && curr?.id === "global_room");

          if (isMatch) {
            setMessages(prev => {
              const exists = prev.some(m => m.id === data.id);
              if (exists) return prev;
              
              const filtered = prev.filter(m => !(m.id.startsWith("temp-") && m.text === data.message && m.senderId === data.senderId));
              
              return [...filtered, {
                id: data.id || `m${Date.now()}_${Math.random()}`,
                senderId: data.senderId,
                text: data.message || "",
                imageUrl: data.imageUrl,
                timestamp: new Date(data.createdAt || Date.now())
              }];
            });
          }
          return curr;
        });
      });

      socket.on("message_deleted", (messageId: string) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token, user]); // Remove currentConversation from here

  // Separate effect to handle room joining
  useEffect(() => {
    if (socketRef.current?.connected) {
      const convoId = currentConversation?.id || "global_room";
      console.log("Socket - joining conversation:", convoId);
      socketRef.current.emit("join_conversation", convoId);
    }
  }, [currentConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function sendMessage() {
    const t = draft.trim();
    if ((!t && !selectedImage) || !socketRef.current || !user || !currentConversation) return;

    let imageUrl = "";

    if (selectedImage) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", selectedImage);

      try {
        const res = await fetch("http://localhost:3000/api/messages/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        imageUrl = data.imageUrl;
      } catch (err) {
        console.error("Error uploading image:", err);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const msgData = {
      conversationId: currentConversation.id,
      message: t,
      imageUrl: imageUrl,
      senderId: user.id
    };

    console.log("Socket - Sending message:", msgData);
    socketRef.current.emit("send_message", msgData);

    setDraft("");
    setSelectedImage(null);
    setImagePreview(null);
    inputRef.current?.focus();
  }


  function deleteMessage(id: string) {
    if (socketRef.current) {
      socketRef.current.emit("delete_message", id);
    }
  }

  async function startPrivateChat(otherUser: User) {
    try {
      const res = await fetch("http://localhost:3000/api/conversations", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ otherUserId: otherUser.id })
      });
      const data = await res.json();
      if (data.id) {
        setCurrentConversation({ id: data.id, name: `${otherUser.firstName} ${otherUser.lastName}` });
        setPanel("friends"); // Switch to friends panel
        setSelectedUser(null);
        if (isMobile) setMobileView("chat");
      }
    } catch (err) {
      console.error("Error starting private chat:", err);
    }
  }

  async function saveProfile() {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          username: editForm.username
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update registeredUsers so messages and sidebar update immediately
        setRegisteredUsers(prev => prev.map(u => u.id === profile.id ? { 
          ...u, 
          firstName: data.firstname, 
          lastName: data.lastname, 
          username: data.username,
          avatar: data.firstname?.[0] || ""
        } : u));
        
        setProfile(prev => ({ 
          ...prev, 
          firstName: data.firstname, 
          lastName: data.lastname, 
          username: data.username,
          avatar: data.firstname?.[0] || ""
        }));
        setEditMode(false);

        // Update localStorage user info if needed
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...storedUser, firstname: data.firstname, lastname: data.lastname, username: data.username }));
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  const grouped = groupByDay(messages);

  const getU = (id: string) => getUser(id, registeredUsers);

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("http://localhost:3000/api/user/avatar", {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.avatarUrl) {
        setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        // Update user in context/localStorage if necessary
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        storedUser.avatarUrl = data.avatarUrl;
        localStorage.setItem("user", JSON.stringify(storedUser));
        
        // Refresh users list to show new avatar everywhere
        setRegisteredUsers(prev => prev.map(u => u.id === profile.id ? { ...u, avatarUrl: data.avatarUrl } : u));
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
    }
  }

  // ── Left sidebar heading ──
  const sidebarTitle = panel === "global" ? "Global Chat" : panel === "friends" ? "Friends" : "Profile";

  const filteredUsers = registeredUsers.filter(u => 
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = userConversations.filter(conv => {
    const otherParticipant = conv.participants.find((p: any) => p.userId !== user?.id);
    const otherUser = registeredUsers.find(u => u.id === otherParticipant?.userId);
    if (!otherUser) return false;
    return otherUser.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           otherUser.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const chatTitle = currentConversation?.name || "Global Chat";

  // ── Styles ──
  const s = {
    root: {
      display: "flex", height: "100vh", width: "100%", overflow: "hidden",
      background: tk.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: tk.text, transition: "background 0.25s, color 0.25s",
    } as React.CSSProperties,

    // Left nav rail
    rail: {
      width: isMobile ? "100%" : 68, 
      height: isMobile ? 65 : "100%",
      display: (isMobile && mobileView === "chat") ? "none" : "flex", 
      flexDirection: (isMobile ? "row" : "column") as React.CSSProperties["flexDirection"],
      alignItems: "center", 
      justifyContent: isMobile ? "space-around" : "flex-start",
      padding: isMobile ? "0 10px" : "16px 0",
      background: tk.surface, 
      borderRight: isMobile ? "none" : `1px solid ${tk.border}`,
      borderTop: isMobile ? `1px solid ${tk.border}` : "none",
      gap: isMobile ? 0 : 6, 
      flexShrink: 0,
      position: (isMobile ? "fixed" : "relative") as React.CSSProperties["position"],
      bottom: isMobile ? 0 : "auto",
      left: isMobile ? 0 : "auto",
      zIndex: 1000,
    },

    // Left panel
    leftPanel: {
      width: isMobile ? "100%" : 320, 
      display: isMobile 
        ? (mobileView === "list" ? "flex" : "none") 
        : (panel === "global" && currentConversation?.id === "global_room" ? "none" : "flex"), 
      flexDirection: "column" as const,
      background: tk.surface, 
      borderRight: `1px solid ${tk.border}`,
      flexShrink: 0, 
      overflow: "hidden",
      paddingBottom: isMobile ? 65 : 0,
    },

    // Chat area
    chatArea: {
      flex: 1, 
      display: (isMobile && mobileView === "list") ? "none" : "flex", 
      flexDirection: "column" as const,
      background: tk.bg, 
      overflow: "hidden", 
      minWidth: 0,
      order: isMobile ? 1 : 3,
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; overflow: hidden; }

        .fc-scroll::-webkit-scrollbar { width: 4px; }
        .fc-scroll::-webkit-scrollbar-track { background: transparent; }
        .fc-scroll::-webkit-scrollbar-thumb { background: ${tk.scrollbar}; border-radius: 4px; }

        .fc-input {
          background: ${tk.input}; border: 1px solid ${tk.inputBorder};
          border-radius: 12px; padding: 11px 16px; font-size: 14px;
          color: ${tk.text}; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border 0.18s, box-shadow 0.18s, background 0.18s;
          caret-color: ${tk.accent};
        }
        .fc-input::placeholder { color: ${tk.textDim}; }
        .fc-input:focus {
          border-color: ${tk.accent};
          box-shadow: 0 0 0 3px ${tk.accentSoft};
          background: ${isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)"};
        }

        .fc-nav-btn {
          width: 44px; height: 44px; border-radius: 14px; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.18s; background: transparent; color: ${tk.textMuted};
          position: relative;
        }
        .fc-nav-btn:hover { background: ${tk.hoverStrong}; color: ${tk.accent}; }
        .fc-nav-btn.active { background: ${tk.accentSoft}; color: ${tk.accent}; }
        .fc-nav-btn.active::before {
          content: ''; position: absolute; 
          left: ${isMobile ? "50%" : "-8px"}; 
          top: ${isMobile ? "-8px" : "50%"}; 
          transform: ${isMobile ? "translateX(-50%)" : "translateY(-50%)"};
          width: ${isMobile ? "22px" : "3px"}; 
          height: ${isMobile ? "3px" : "22px"}; 
          border-radius: ${isMobile ? "0 0 3px 3px" : "0 3px 3px 0"};
          background: ${tk.accent};
        }

        .fc-user-row {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px;
          border-radius: 12px; cursor: pointer; transition: background 0.15s;
        }
        .fc-user-row:hover { background: ${tk.hoverStrong}; }

        .fc-msg-wrap { position: relative; }
        .fc-msg-actions {
          position: absolute; top: -6px; right: 0;
          display: none; gap: 4px; z-index: 10;
        }
        .fc-msg-wrap:hover .fc-msg-actions { display: flex; }
        .fc-action-btn {
          width: 26px; height: 26px; border-radius: 8px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; transition: all 0.15s;
          background: ${isDark ? "#1e2132" : "#ffffff"};
          color: ${tk.textMuted};
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .fc-action-btn:hover { background: #ef4444; color: #fff; }

        .fc-send-btn {
          width: 42px; height: 42px; border-radius: 12px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: #fff; transition: all 0.18s; flex-shrink: 0;
        }
        .fc-send-btn:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.45); transform: scale(1.05); }
        .fc-send-btn:active { transform: scale(0.97); }

        .fc-edit-btn {
          padding: 8px 18px; border-radius: 10px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }

        .fc-theme-btn {
          width: 38px; height: 38px; border-radius: 12px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: ${tk.accentSoft}; color: ${tk.accent};
          transition: all 0.18s; margin-top: auto; flex-shrink: 0;
        }
        .fc-theme-btn:hover { background: ${tk.accent}; color: #fff; }

        .fc-day-badge {
          display: flex; align-items: center; gap: 12px; padding: 8px 0; margin: 8px 0;
        }
        .fc-day-line { flex: 1; height: 1px; background: ${tk.border}; }
        .fc-day-text {
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
          text-transform: uppercase; color: ${tk.textDim};
          padding: 3px 10px; border-radius: 20px;
          background: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"};
        }

        .fc-tooltip {
          position: absolute; left: 76px; top: 50%; transform: translateY(-50%);
          background: ${isDark ? "#1e2132" : "#1e2030"}; color: #e2e8f0;
          font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px;
          white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s;
          z-index: 100;
        }
        .fc-nav-btn:hover .fc-tooltip { opacity: 1; }

        @keyframes msgIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .fc-msg-anim { animation: msgIn 0.2s ease both; }
      `}</style>

      <div style={{ ...s.root, flexDirection: isMobile ? "column" : "row" }}>

        {/* ══════════════ RAIL (leftmost icon bar) ══════════════ */}
        <div style={s.rail}>
          {/* Logo */}
          {!isMobile && (
            <>
              <div style={{ width:40, height:40, background:"linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8, flexShrink:0 }}>
                <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24">
                  <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 10H6V8h12v4z"/>
                </svg>
              </div>
              <div style={{ width:28, height:1, background:tk.border, margin:"4px 0" }} />
            </>
          )}

          {/* Global chat */}
          <button className={`fc-nav-btn${panel==="global"?" active":""}`} onClick={() => {
            setPanel("global");
            setSelectedUser(null);
            setCurrentConversation({ id: "global_room", name: "Global Chat" });
            if (isMobile) setMobileView("chat");
          }} title="">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
            </svg>
            {!isMobile && <span className="fc-tooltip">Global</span>}
          </button>

          {/* Friends */}
          <button className={`fc-nav-btn${panel==="friends"?" active":""}`} onClick={()=>{
            setPanel("friends");
            if (isMobile) setMobileView("list");
          }} title="">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            {!isMobile && <span className="fc-tooltip">Friends</span>}
          </button>

          {/* spacer */}
          {!isMobile && <div style={{ flex:1 }} />}

          {/* Theme toggle */}
          <button className="fc-theme-btn" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} title={isDark?"Light mode":"Dark mode"} style={{ margin: isMobile ? 0 : "auto 0 0" }}>
            {isDark
              ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>

          {/* Profile */}
          <button className={`fc-nav-btn${panel==="profile" && !selectedUser ?" active":""}`} onClick={()=>{setSelectedUser(null); setPanel("profile"); setEditMode(false); if (isMobile) setMobileView("list");}} style={{ marginBottom: isMobile ? 0 : 4, marginTop: isMobile ? 0 : 6 }} title="">
            <div style={{ width:34, height:34, borderRadius:10, background:profile.avatarUrl ? `url(http://localhost:3000${profile.avatarUrl}) center/cover` : avatarColors(profile.firstName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", letterSpacing:"0.02em", position:"relative" }}>
              {!profile.avatarUrl && (profile.firstName[0]||"")+(profile.lastName[0]||"")}
              <div style={{ position:"absolute", bottom:-1, right:-1, width:9, height:9, borderRadius:"50%", background:tk.online, border:`2px solid ${tk.surface}` }} />
            </div>
            {!isMobile && <span className="fc-tooltip">Profile</span>}
          </button>
        </div>

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div style={s.leftPanel}>
          {/* Hidden File Input for Profile */}
          <input
            type="file"
            id="profile-img-input"
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleAvatarUpload}
          />

          {/* Header */}
          <div style={{ padding:"20px 18px 14px", borderBottom:`1px solid ${tk.border}`, flexShrink:0 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, color:tk.text, letterSpacing:"-0.01em" }}>
              {sidebarTitle}
            </div>
            {panel === "global" && (
              <div style={{ fontSize:12, color:tk.textMuted, marginTop:3 }}>
                {registeredUsers.length} members
              </div>
            )}
            {panel === "friends" && (
              <div style={{ fontSize:12, color:tk.textMuted, marginTop:3 }}>{userConversations.length} active chats</div>
            )}
          </div>

          {/* Search (global / friends) */}
          {panel !== "profile" && (
            <div style={{ padding:"12px 14px 8px", flexShrink:0 }}>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:tk.textDim }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input 
                  className="fc-input" 
                  style={{ width:"100%", paddingLeft:32, fontSize:13 }} 
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* User list */}
          <div className="fc-scroll" style={{ flex:1, overflowY:"auto", padding:"8px 10px" }}>
            {panel === "global" && (
              <>
                {filteredUsers.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: tk.textMuted, fontSize: "13px" }}>
                    No users found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredUsers.map(u => {
                    const isOnline = onlineUsers.includes(u.id);
                    return (
                      <div key={u.id} 
                        className="fc-user-row" 
                        style={u.id === selectedUser?.id ? { background: tk.hoverStrong, cursor: "pointer" } : { cursor: "pointer" }}
                        onClick={() => {
                           setSelectedUser(u);
                           setPanel("profile");
                           if (isMobile) setMobileView("list"); // Stay in list to see profile in left panel
                        }}
                      >
                        <div style={{ position:"relative", flexShrink:0 }}>
                          <div style={{ width:38, height:38, borderRadius:11, background: u.avatarUrl ? `url(http://localhost:3000${u.avatarUrl}) center/cover` : avatarColors(u.firstName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>
                            {!u.avatarUrl && u.avatar}
                          </div>
                          <div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background: isOnline ? tk.online : tk.offline, border:`2px solid ${tk.surface}` }} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:tk.text, display: "flex", alignItems: "center", gap: 5 }}>
                            {u.firstName} {u.lastName}
                            {u.id === user?.id && (
                              <span style={{ fontSize:10, background:tk.accentSoft, color:tk.accent, padding:"1px 6px", borderRadius:4, fontWeight:700 }}>You</span>
                            )}
                          </div>
                          <div style={{ fontSize:11, color:tk.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.username}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {panel === "friends" && (
               <div className="fc-scroll" style={{ flex:1, overflowY:"auto" }}>
                 {userConversations.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: tk.textMuted }}>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>No friends yet</div>
                      <div style={{ fontSize: "12px", marginTop: "4px" }}>Add users from Global Chat to start private conversations.</div>
                    </div>
                 ) : filteredConversations.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: tk.textMuted, fontSize: "13px" }}>
                      No chats found matching "{searchQuery}"
                    </div>
                 ) : (
                    filteredConversations.map(conv => {
                      const otherParticipant = conv.participants.find((p: any) => p.userId !== user?.id);
                      const otherUser = registeredUsers.find(u => u.id === otherParticipant?.userId);
                      if (!otherUser) return null;
                      
                      const isOnline = onlineUsers.includes(otherUser.id);
                      const isActive = currentConversation?.id === conv.id;

                      return (
                        <div key={conv.id} 
                          className="fc-user-row" 
                          style={isActive ? { background: tk.hoverStrong, cursor: "pointer" } : { cursor: "pointer" }}
                          onClick={() => {
                            setCurrentConversation({ 
                              id: conv.id, 
                              name: `${otherUser.firstName} ${otherUser.lastName}` 
                            });
                            if (isMobile) setMobileView("chat");
                          }}
                        >
                          <div style={{ position:"relative", flexShrink:0 }}>
                            <div style={{ width:38, height:38, borderRadius:11, background: otherUser.avatarUrl ? `url(http://localhost:3000${otherUser.avatarUrl}) center/cover` : avatarColors(otherUser.firstName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>
                              {!otherUser.avatarUrl && otherUser.avatar}
                            </div>
                            <div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background: isOnline ? tk.online : tk.offline, border:`2px solid ${tk.surface}` }} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:tk.text }}>
                              {otherUser.firstName} {otherUser.lastName}
                            </div>
                            <div style={{ fontSize:11, color:tk.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {conv.messages && conv.messages.length > 0 
                                ? conv.messages[conv.messages.length - 1].content 
                                : "No messages yet"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                 )}
               </div>
            )}

            {panel === "profile" && !editMode && (
              <div style={{ padding:"16px 4px", display:"flex", flexDirection:"column", gap:20 }}>
                {/* Avatar large */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"20px 0 10px" }}>
                  <div style={{ 
                    width:72, 
                    height:72, 
                    borderRadius:22, 
                    background: (selectedUser ? selectedUser.avatarUrl : profile.avatarUrl) ? `url(http://localhost:3000${selectedUser ? selectedUser.avatarUrl : profile.avatarUrl}) center/cover` : avatarColors(selectedUser ? selectedUser.firstName : profile.firstName), 
                    display:"flex", 
                    alignItems:"center", 
                    justifyContent:"center", 
                    fontSize:24, 
                    fontWeight:800, 
                    color:"#fff", 
                    position:"relative",
                    overflow: "visible"
                  }}>
                    {!(selectedUser ? selectedUser.avatarUrl : profile.avatarUrl) && (selectedUser ? (selectedUser.firstName[0]||"")+(selectedUser.lastName[0]||"") : (profile.firstName[0]||"")+(profile.lastName[0]||""))}
                    <div style={{ position:"absolute", top:-2, right:-2, width:14, height:14, borderRadius:"50%", background: (selectedUser ? onlineUsers.includes(selectedUser.id) : true) ? tk.online : tk.offline, border:`3px solid ${tk.surface}`, zIndex: 4 }} />
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:tk.text, textAlign:"center" }}>{selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : `${profile.firstName} ${profile.lastName}`}</div>
                    <div style={{ fontSize:12, color:tk.textMuted, textAlign:"center", marginTop:2 }}>{selectedUser ? selectedUser.username : profile.username}</div>
                  </div>
                </div>

                {/* Info cards */}
                {[
                  { label:"First Name",  value: selectedUser ? selectedUser.firstName : profile.firstName },
                  { label:"Last Name",   value: selectedUser ? selectedUser.lastName : profile.lastName  },
                  { label:"Username",    value: selectedUser ? selectedUser.username : profile.username  },
                ].map(row => (
                  <div key={row.label} style={{ background:tk.surfaceAlt, borderRadius:12, padding:"10px 14px", border:`1px solid ${tk.border}` }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:tk.textDim, marginBottom:3 }}>{row.label}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:tk.text }}>{row.value}</div>
                  </div>
                ))}

                {!selectedUser || selectedUser.id === user?.id ? (
                  <button className="fc-edit-btn" style={{ background:"linear-gradient(135deg,#6366f1,#818cf8)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
                    onClick={()=>{ setEditForm({ firstName:profile.firstName, lastName:profile.lastName, username:profile.username, password:"" }); setEditMode(true); }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit Profile
                  </button>
                ) : (
                  <button className="fc-edit-btn" style={{ background:"linear-gradient(135deg,#6366f1,#818cf8)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
                    onClick={() => startPrivateChat(selectedUser)}>
                    Message
                  </button>
                )}

                <div style={{ height:1, background:tk.border }} />

                {(!selectedUser || selectedUser.id === user?.id) && (
                  <button className="fc-edit-btn" style={{ background:"rgba(239,68,68,0.1)", color:tk.danger, border:`1px solid rgba(239,68,68,0.2)`, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }} onClick={handleLogout}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 00-2-2V5a2 2 0 002-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log Out
                  </button>
                )}
              </div>
            )}

            {panel === "profile" && editMode && (
              <div style={{ padding:"12px 4px", display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:tk.text }}>Edit Profile</div>
                  
                  {/* Camera Button in Edit Mode */}
                  <button 
                    onClick={() => document.getElementById("profile-img-input")?.click()}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "10px",
                      background: tk.accentSoft,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: tk.accent,
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = tk.accent; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = tk.accentSoft; e.currentTarget.style.color = tk.accent; }}
                    title="Change Profile Picture"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                  </button>
                </div>

                {/* Avatar Preview in Edit Mode */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 20, 
                    background: profile.avatarUrl ? `url(http://localhost:3000${profile.avatarUrl}) center/cover` : avatarColors(profile.firstName), 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: 20, 
                    fontWeight: 800, 
                    color: "#fff",
                    border: `2px solid ${tk.border}`
                  }}>
                    {!profile.avatarUrl && (profile.firstName[0]||"")+(profile.lastName[0]||"")}
                  </div>
                </div>

                {(["firstName","lastName","username","password"] as (keyof EditForm)[]).map(field => (
                  <div key={field} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <label style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:tk.textDim }}>
                      {field === "firstName" ? "First Name" : field === "lastName" ? "Last Name" : field === "username" ? "Username" : "New Password"}
                    </label>
                    <input
                      className="fc-input"
                      style={{ width:"100%", fontSize:13 }}
                      type={field === "password" ? "password" : "text"}
                      placeholder={field === "password" ? "Leave blank to keep current" : ""}
                      value={editForm[field]}
                      onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                    />
                  </div>
                ))}

                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <button className="fc-edit-btn" style={{ flex:1, background:"linear-gradient(135deg,#6366f1,#818cf8)", color:"#fff" }} onClick={saveProfile}>Save</button>
                  <button className="fc-edit-btn" style={{ flex:1, background:tk.surfaceAlt, color:tk.textMuted, border:`1px solid ${tk.border}` }} onClick={()=>setEditMode(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ CHAT AREA ══════════════ */}
        <div style={s.chatArea}>

          {/* Chat header */}
          <div style={{ padding: isMobile ? "0 12px" : "0 24px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${tk.border}`, background:tk.surface, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 8 : 12 }}>
              {isMobile && (
                <button 
                  onClick={() => setMobileView("list")}
                  style={{ background: "none", border: "none", color: tk.text, padding: "8px 4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
              <div style={{ width:36, height:36, borderRadius:11, background:"linear-gradient(135deg,#6366f1,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="17" height="17" fill="#fff" viewBox="0 0 24 24">
                  <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 10H6V8h12v4z"/>
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize: isMobile ? 16 : 18, fontWeight:800, color:tk.text, letterSpacing:"-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chatTitle}</div>
                {currentConversation?.id === "global_room" ? (
                  <div style={{ fontSize:11, color:tk.textMuted }}>{registeredUsers.length} members · {onlineUsers.length} online</div>
                ) : (
                  <div style={{ fontSize:11, color:tk.textMuted }}>Private Conversation</div>
                )}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {/* header theme badge */}
              {!isMobile && (
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: 800, 
                  color: tk.accent, 
                  background: tk.accentSoft, 
                  padding: "6px 16px", 
                  borderRadius: 12, 
                  fontFamily: "'Inter', sans-serif", 
                  letterSpacing: "-0.02em" 
                }}>
                  FluxChat
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="fc-scroll" style={{ flex:1, overflowY:"auto", padding: isMobile ? "12px" : "16px 24px", display:"flex", flexDirection:"column", gap:2 }}>
            {grouped.map(group => (
              <div key={group.label}>
                {/* Day separator */}
                <div className="fc-day-badge">
                  <div className="fc-day-line" />
                  <span className="fc-day-text">{group.label}</span>
                  <div className="fc-day-line" />
                </div>

                {/* Messages in day */}
                {group.messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  const sender = getU(msg.senderId);
                  const prevMsg = group.messages[idx - 1];
                  const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;

                  return (
                    <div key={msg.id} className="fc-msg-anim" style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: showAvatar ? 10 : 2, marginTop: showAvatar && idx > 0 ? 10 : 0 }}>
                      {/* Other user avatar */}
                      {!isMe && (
                        <div style={{ width:32, flexShrink:0, marginRight:8, alignSelf:"flex-end", marginBottom:2 }}>
                          {showAvatar && (
                            <div style={{ width:32, height:32, borderRadius:10, background: sender.avatarUrl ? `url(http://localhost:3000${sender.avatarUrl}) center/cover` : avatarColors(sender.firstName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>
                              {!sender.avatarUrl && sender.avatar}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ maxWidth: isMobile ? "85%" : "62%", display:"flex", flexDirection:"column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                        {/* Sender name */}
                        {!isMe && showAvatar && (
                          <div style={{ fontSize:11, fontWeight:700, color:avatarColors(sender.firstName), marginBottom:4, paddingLeft:2 }}>
                            {sender.firstName} {sender.lastName}
                          </div>
                        )}

                        <div className="fc-msg-wrap">
                          {/* Delete button */}
                          <div className="fc-msg-actions" style={{ right: isMe ? "auto" : undefined, left: isMe ? 0 : "auto", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                            {isMe && (
                              <button className="fc-action-btn" onClick={() => deleteMessage(msg.id)} title="Delete">
                                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Bubble */}
                          <div style={{ position: "relative" }}>
                            <div style={{
                              padding: "9px 14px",
                              borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                              background: isMe ? tk.msgMe : tk.msgOther,
                              border: isMe ? "none" : `1px solid ${tk.msgOtherBorder}`,
                              color: isMe ? "#fff" : tk.text,
                              fontSize: 14,
                              lineHeight: 1.5,
                              wordBreak: "break-word",
                              boxShadow: isMe ? "0 4px 14px rgba(99,102,241,0.25)" : isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                            }}>
                              {msg.imageUrl && (
                                <img 
                                  src={`http://localhost:3000${msg.imageUrl}`} 
                                  alt="Shared" 
                                  style={{ 
                                    maxWidth: "100%", 
                                    maxHeight: "300px", 
                                    borderRadius: "8px", 
                                    marginBottom: msg.text ? "8px" : "0",
                                    display: "block"
                                  }} 
                                />
                              )}
                              {msg.text}
                            </div>
                            
                            {user?.username === "admin" && (
                              <button 
                                onClick={() => deleteMessage(msg.id)}
                                style={{
                                  position: "absolute",
                                  top: -10,
                                  [isMe ? "right" : "left"]: -15,
                                  background: tk.danger,
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: 20,
                                  height: 20,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  zIndex: 10
                                }}
                                title="Delete message"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* My avatar */}
                      {isMe && (
                        <div style={{ width:32, flexShrink:0, marginLeft:8, alignSelf:"flex-end", marginBottom:2 }}>
                          {showAvatar && (
                            <div style={{ width:32, height:32, borderRadius:10, background: profile.avatarUrl ? `url(http://localhost:3000${profile.avatarUrl}) center/cover` : avatarColors(profile.firstName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>
                              {!profile.avatarUrl && (profile.firstName[0]||"")+(profile.lastName[0]||"")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: isMobile ? "8px 12px 12px" : "12px 20px 16px", borderTop:`1px solid ${tk.border}`, background:tk.surface, flexShrink:0, position: "relative" }}>
            {imagePreview && (
              <div style={{ position: "absolute", bottom: "80px", left: "20px", background: tk.surface, padding: "8px", borderRadius: "12px", border: `1px solid ${tk.border}`, display: "flex", alignItems: "flex-start", gap: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                <img src={imagePreview} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                <button 
                  onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                  style={{ background: tk.danger, color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                  ×
                </button>
              </div>
            )}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} style={{ position: "absolute", bottom: "80px", left: "20px", zIndex: 1000 }}>
                <EmojiPicker 
                  theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT} 
                  onEmojiClick={(emojiData) => {
                    setDraft(prev => prev + emojiData.emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                />
              </div>
            )}
            <div 
              style={{ 
                display:"flex", 
                alignItems:"center", 
                gap: isMobile ? 6 : 10, 
                background:tk.input, 
                border:`1px solid ${tk.inputBorder}`, 
                borderRadius:16, 
                padding: isMobile ? "4px 6px 4px 12px" : "6px 8px 6px 16px", 
                transition:"border 0.18s, box-shadow 0.18s",
                cursor: "text" 
              }}
              onClick={() => inputRef.current?.focus()}
              onFocus={e=>{(e.currentTarget as HTMLElement).style.borderColor=tk.accent;(e.currentTarget as HTMLElement).style.boxShadow=`0 0 0 3px ${tk.accentSoft}`;}}
              onBlur={e=>{(e.currentTarget as HTMLElement).style.borderColor=tk.inputBorder;(e.currentTarget as HTMLElement).style.boxShadow="none";}}>

              {/* Emoji button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                style={{ background:"none", border:"none", cursor:"pointer", color:tk.textDim, display:"flex", alignItems:"center", fontSize:18, flexShrink:0, transition:"color 0.15s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=tk.accent}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=tk.textDim}>
                😊
              </button>

              <input
                ref={inputRef}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize: isMobile ? 13 : 14, color:tk.text, fontFamily:"'DM Sans',sans-serif", caretColor:tk.accent }}
                placeholder={isMobile ? "Message..." : `Message ${currentConversation?.name || "Global Chat"}…`}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileSelect}
              />

              <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                disabled={isUploading}
                style={{ background: "none", border: "none", cursor: "pointer", color: tk.textDim, display: "flex", alignItems: "center", transition: "color 0.15s", opacity: isUploading ? 0.5 : 1, flexShrink: 0 }}
                onMouseEnter={e => !isUploading && (e.currentTarget.style.color = tk.accent)}
                onMouseLeave={e => !isUploading && (e.currentTarget.style.color = tk.textDim)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </button>

              <button className="fc-send-btn" onClick={sendMessage} disabled={isUploading || (!draft.trim() && !selectedImage)} style={{ opacity: (draft.trim() || selectedImage) ? 1 : 0.45, width: isMobile ? 32 : 36, height: isMobile ? 32 : 36 }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}