import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../api";
import { monitorAuthState } from "../firebase/index";

function Chat({ selectedChatUser, onSelectUser }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
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

  return (
    <div className="grid min-h-[72vh] gap-4 bg-white p-4 md:grid-cols-[18rem_1fr] md:px-8">
      <aside className="border-2 border-dashed border-slate-300 bg-white">
        <div className="border-b-2 border-dashed border-slate-300 p-4">
          <h2 className="text-2xl font-extrabold text-black">Chat</h2>
          <p className="text-sm text-slate-500">All users</p>
        </div>
        <div className="space-y-2 p-3">
          {users.map((item) => {
            const isActive = item.email === selectedChatUser?.email;

            return (
              <button
                key={item.email}
                type="button"
                onClick={() => onSelectUser?.(item)}
                className={`flex w-full items-center gap-3 border p-3 text-left transition ${
                  isActive ? "border-black bg-slate-100" : "border-dashed border-slate-300 bg-white"
                }`}
              >
                <img
                  src={item.photo || "/like.png"}
                  alt={item.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-black">{item.name || "Cat User"}</p>
                  <p className="truncate text-xs text-slate-500">{item.email}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="border-2 border-dashed border-slate-300 bg-white">
        <div className="border-b-2 border-dashed border-slate-300 p-4">
          <h3 className="text-2xl font-extrabold text-black">{chatHeader}</h3>
        </div>

        <div className="flex min-h-[50vh] flex-col gap-3 p-4">
          <div className="flex-1 space-y-3 overflow-y-auto">
            {!selectedChatUser ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                Choose a user from the left.
              </div>
            ) : loadingMessages && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                No messages yet.
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.senderEmail === currentUser?.email;

                return (
                  <div
                    key={message.messageId}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] border px-4 py-3 text-sm ${
                        isOwnMessage
                          ? "border-black bg-black text-white"
                          : "border-dashed border-slate-300 bg-white text-slate-800"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-3 border-t-2 border-dashed border-slate-300 pt-4">
            <input
              type="text"
              className="simple-input flex-1 px-4 py-3 text-sm"
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
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!selectedChatUser || !messageText.trim()}
              className="bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Chat;
