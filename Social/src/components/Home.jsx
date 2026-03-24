import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Account, Chat, Posts, Users } from "../index";
import { logout, monitorAuthState } from "../firebase/index";
import IonIcon from "./IonIcon";

const navItems = [
  { id: "post", label: "Home", shortLabel: "Home", icon: "home" },
  { id: "users", label: "Friends", shortLabel: "Friends", icon: "people" },
  { id: "chat", label: "Messages", shortLabel: "Chat", icon: "chatbubble-ellipses" },
  { id: "account", label: "Profile", shortLabel: "Profile", icon: "person-circle" },
];

const quickLinks = [
  { label: "Groups", icon: "people-circle-outline", tone: "bg-amber-100 text-amber-600" },
  { label: "Marketplace", icon: "storefront-outline", tone: "bg-violet-100 text-violet-600" },
  { label: "Saved", icon: "bookmark-outline", tone: "bg-rose-100 text-rose-500" },
  { label: "Pages", icon: "flag-outline", tone: "bg-cyan-100 text-cyan-600" },
  { label: "Favourites", icon: "star-outline", tone: "bg-slate-200 text-slate-600" },
];

const groupLinks = ["The Nerd Head", "Take a Trip", "Papa Ki Pari", "College Friends", "My Dream House"];

function Home() {
  const [page, setPage] = useState("post");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = monitorAuthState((currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/register");
  };

  const renderActivePage = () => {
    if (page === "post") {
      return <Posts />;
    }

    if (page === "chat") {
      return (
        <Chat
          selectedChatUser={selectedChatUser}
          onSelectUser={setSelectedChatUser}
        />
      );
    }

    if (page === "users") {
      return (
        <Users
          onOpenChat={(nextUser) => {
            setSelectedChatUser(nextUser);
            setPage("chat");
          }}
        />
      );
    }

    return <Account />;
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-[#f2f4f8] text-slate-900">
      <div className="grid min-h-screen w-full grid-cols-1 gap-2 p-2">
        <header className="rounded-[1.75rem] border border-white/80 bg-white/95 px-4 py-3 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur xl:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1d235c] shadow-[0_8px_20px_rgba(29,35,92,0.12)]">
                  <img src="/like.png" className="w-8" alt="CatPost" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[#1d235c]">CatPost.</h1>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-bold text-rose-500 lg:hidden"
              >
                <IonIcon name="log-out-outline" className="text-base" />
                Logout
              </button>
            </div>

            <label className="flex w-full items-center gap-3 rounded-full bg-slate-100 px-4 py-3 text-slate-400 lg:max-w-xl">
              <IonIcon name="search-outline" className="text-lg" />
              <input
                type="text"
                placeholder="Search for friends, groups, pages"
                className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="hidden items-center gap-3 lg:flex">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#1d235c]"
              >
                <IonIcon name="chatbox-ellipses-outline" className="text-lg" />
              </button>
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#1d235c]"
              >
                <IonIcon name="notifications-outline" className="text-lg" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
              </button>
              <div className="flex items-center gap-3 rounded-full bg-slate-50 px-2 py-1.5">
                <div className="relative">
                  <img
                    src={user?.photoURL || "/like.png"}
                    alt={user?.displayName || "Cat User"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="pr-2">
                  <p className="text-sm font-bold text-slate-900">
                    {user?.displayName || "Cat User"}
                  </p>
                  <p className="text-xs text-slate-500">Online now</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-1 gap-2 lg:grid-cols-[11rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)]">
          <aside className="hidden rounded-[1.75rem] border border-white/80 bg-white/95 p-3 shadow-[0_20px_55px_rgba(15,23,42,0.08)] lg:block">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = page === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPage(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                      isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isActive ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <IonIcon name={`${item.icon}-outline`} className="text-base" />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-1">
              {quickLinks.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700"
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.tone}`}>
                    <IonIcon name={item.icon} className="text-base" />
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              <IonIcon name="chevron-down-outline" className="text-sm" />
              See More
            </button>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="px-3 text-sm font-bold text-[#1d235c]">My Group</p>
              <div className="mt-3 space-y-1">
                {groupLinks.map((group, index) => (
                  <div key={group} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                      {index + 1}
                    </div>
                    <span className="truncate">{group}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 hidden w-full items-center justify-center gap-2 rounded-full bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-500 xl:inline-flex"
              >
                <IonIcon name="log-out-outline" className="text-base" />
                Logout
              </button>
            </div>
          </aside>

          <main className="min-w-0">{renderActivePage()}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 p-2 lg:hidden">
        <div className="grid grid-cols-4 gap-2 rounded-[1.5rem] border border-white/90 bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          {navItems.map((item) => {
            const isActive = page === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage(item.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition ${
                  isActive ? "bg-slate-100 text-[#1d235c]" : "text-slate-500"
                }`}
              >
                <IonIcon name={`${item.icon}-outline`} className="text-lg" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default Home;
