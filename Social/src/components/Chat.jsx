/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../api";
import { monitorAuthState } from "../firebase/index";
import IonIcon from "./IonIcon";

function Chat({ selectedChatUser, onSelectUser }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const unsubscribe = monitorAuthState((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(
          buildApiUrl(`/users?email=${encodeURIComponent(currentUser.email)}`)
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);

        if (!selectedChatUser && data.length > 0) {
          onSelectUser?.(data[0]);
        }
      } catch (error) {
        console.error("Error fetching chat users:", error);
      }
    };

    fetchUsers();
  }, [currentUser, onSelectUser, selectedChatUser]);

  useEffect(() => {
    if (!currentUser?.email || !selectedChatUser?.email) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await fetch(
          buildApiUrl(
            `/messages?userA=${encodeURIComponent(currentUser.email)}&userB=${encodeURIComponent(
              selectedChatUser.email
            )}`
          )
        );

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    const intervalId = window.setInterval(fetchMessages, 4000);

    return () => window.clearInterval(intervalId);
  }, [currentUser, selectedChatUser]);

  const handleSendMessage = async () => {
    if (!currentUser?.email || !selectedChatUser?.email || !messageText.trim()) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/messages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderEmail: currentUser.email,
          senderName: currentUser.displayName || "Cat User",
          senderPhoto: currentUser.photoURL || "",
          receiverEmail: selectedChatUser.email,
          text: messageText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setMessages((currentMessages) => [...currentMessages, data.data]);
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const chatHeader = useMemo(() => {
    if (!selectedChatUser) {
      return "Choose a user to start chatting";
    }

    return selectedChatUser.name || selectedChatUser.email;
  }, [selectedChatUser]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((item) => {
      const name = item.name?.toLowerCase() || "";
      const email = item.email?.toLowerCase() || "";
      return name.includes(query) || email.includes(query);
    });
  }, [searchQuery, users]);

  return (
    <div className="chat-layout min-h-[calc(100vh-10rem)] gap-2">
      <aside className="chat-sidebar rounded-[1.75rem] border border-white/70 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        <div className="chat-sidebar-header">
          <div>
            <p className="section-label">Inbox</p>
            <h2>Direct messages</h2>
          </div>
          <span className="chat-count-pill inline-flex items-center gap-2">
            <IonIcon name="people-outline" className="text-sm" />
            {users.length} people
          </span>
        </div>

        <label className="chat-search-input flex items-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-slate-400">
          <IonIcon name="search-outline" className="text-base" />
          <input
            type="text"
            className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="Search people"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="chat-user-list">
          {filteredUsers.map((item) => {
            const isActive = item.email === selectedChatUser?.email;

            return (
              <button
                key={item.email}
                type="button"
                onClick={() => onSelectUser?.(item)}
                className={`chat-user-item ${isActive ? "chat-user-item-active" : ""}`}
              >
                <img
                  src={item.photo || "/like.png"}
                  alt={item.name}
                  className="chat-user-avatar"
                />
                <div className="chat-user-copy">
                  <p>{item.name || "Cat User"}</p>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {item.email}
                  </span>
                </div>
                <IonIcon
                  name={isActive ? "radio-button-on" : "ellipse-outline"}
                  className={`ml-auto text-base ${isActive ? "text-emerald-500" : "text-slate-300"}`}
                />
              </button>
            );
          })}

          {!filteredUsers.length ? (
            <div className="chat-empty chat-empty-compact">
              No users matched your search.
            </div>
          ) : null}
        </div>
      </aside>

      <section className="chat-panel flex flex-col rounded-[1.75rem] border border-white/70 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        <div className="chat-panel-header">
          <div className="chat-panel-profile">
            <img
              src={selectedChatUser?.photo || "/like.png"}
              alt={selectedChatUser?.name || "Cat User"}
              className="chat-panel-avatar"
            />
            <div>
              <h3>{chatHeader}</h3>
              <p className="inline-flex items-center gap-2">
                {selectedChatUser?.email ? (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.15)]" />
                    {selectedChatUser.email}
                  </>
                ) : (
                  "Pick someone from the left to open a conversation."
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="chat-count-pill">
              {loadingMessages ? "Syncing..." : `${messages.length} messages`}
            </span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <IonIcon name="call-outline" className="text-lg" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <IonIcon name="videocam-outline" className="text-lg" />
            </button>
          </div>
        </div>

        <div className="chat-messages flex-1">
          {!selectedChatUser ? (
            <div className="chat-empty">
              Choose a user from the left to start a conversation.
            </div>
          ) : loadingMessages && messages.length === 0 ? (
            <div className="chat-empty">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">No messages yet. Send the first hello.</div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderEmail === currentUser?.email;

              return (
                <div
                  key={message.messageId}
                  className={`chat-bubble-row ${isOwnMessage ? "chat-bubble-row-own" : ""}`}
                >
                  <div className={`chat-bubble ${isOwnMessage ? "chat-bubble-own" : ""}`}>
                    <p>{message.text}</p>
                    <span className="chat-bubble-time">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="chat-composer mt-3 border-t border-slate-100 pt-3">
          <label className="chat-compose-input flex flex-1 items-center gap-3 rounded-full bg-slate-100 px-4 py-3 text-slate-400">
            <IonIcon name="create-outline" className="text-base" />
            <input
              type="text"
              className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              placeholder={selectedChatUser ? "Type your message" : "Choose a user first"}
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSendMessage();
                }
              }}
              disabled={!selectedChatUser}
            />
          </label>
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!selectedChatUser || !messageText.trim()}
            className="button-primary chat-send-button inline-flex items-center gap-2"
          >
            <IonIcon name="paper-plane-outline" className="text-base" />
            Send
          </button>
        </div>
      </section>
    </div>
  );
}

export default Chat;
