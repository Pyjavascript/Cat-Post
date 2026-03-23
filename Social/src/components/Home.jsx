import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Account, Chat, Posts, Users } from "../index";
import { logout } from "../firebase/index";

function Home() {
  const [page, setPage] = useState("post");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const navigate = useNavigate();
  const navItems = [
    { id: "post", label: "Posts", shortLabel: "Feed" },
    { id: "chat", label: "Chat", shortLabel: "Chat" },
    { id: "users", label: "Users", shortLabel: "Users" },
    { id: "account", label: "Account", shortLabel: "Profile" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/register");
  };

  return (
    <div className="mainpage dashboard-shell min-h-screen w-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
        <div className="dashboard-topbar">
          <div className="flex flex-col justify-between gap-4 p-3 md:flex-row md:items-center">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="dashboard-brand-icon">
                  <img src="/like.png" className="w-8" alt="" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                    Cat Post
                  </p>
                  <h1 className="text-2xl font-extrabold text-black">Dashboard</h1>
                </div>
              </div>
              <button onClick={handleLogout} className="dashboard-logout">
                Logout
              </button>
            </div>
            <div className="hidden flex-wrap gap-2 md:flex">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`dashboard-tab ${page === item.id ? "dashboard-tab-active" : ""}`}
                  onClick={() => setPage(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 w-full pb-28 md:pb-0">
          {page === "post" ? <Posts /> : null}
          {page === "chat" ? (
            <Chat
              selectedChatUser={selectedChatUser}
              onSelectUser={setSelectedChatUser}
            />
          ) : null}
          {page === "users" ? (
            <Users
              onOpenChat={(nextUser) => {
                setSelectedChatUser(nextUser);
                setPage("chat");
              }}
            />
          ) : null}
          {page === "account" ? <Account /> : null}
        </div>
      </div>

      <nav className="mobile-bottom-nav md:hidden">
        <div className="mobile-bottom-nav-inner">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mobile-bottom-nav-item ${
                page === item.id ? "mobile-bottom-nav-item-active" : ""
              }`}
              onClick={() => setPage(item.id)}
            >
              <span className="mobile-bottom-nav-pill" />
              <span>{item.shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default Home;
