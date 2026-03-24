/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../api";
import { monitorAuthState } from "../firebase/index";
import IonIcon from "./IonIcon";

function Users({ onOpenChat }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

    fetch(buildApiUrl(`/users?email=${encodeURIComponent(currentUser.email)}`))
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        return response.json();
      })
      .then((data) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, [currentUser]);

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
    <div className="users-shell">
      <section className="users-hero rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div>
          <p className="section-label">Community</p>
          <h2>Meet everyone on CatPost</h2>
          <p className="users-hero-copy">
            Discover members, scan profiles quickly, and jump straight into a chat.
          </p>
        </div>
        <label className="users-search-input flex items-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-slate-400">
          <IonIcon name="search-outline" className="text-base" />
          <input
            type="text"
            className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="users-stats-row">
        <div className="users-stat-card rounded-[1.8rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <IonIcon name="people-outline" className="text-xl text-slate-500" />
          <strong>{users.length}</strong>
          <span>Total members</span>
        </div>
        <div className="users-stat-card rounded-[1.8rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <IonIcon name="sparkles-outline" className="text-xl text-sky-500" />
          <strong>{filteredUsers.length}</strong>
          <span>Visible now</span>
        </div>
        <div className="users-stat-card rounded-[1.8rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <IonIcon name="chatbubble-ellipses-outline" className="text-xl text-rose-500" />
          <strong>{Math.max(filteredUsers.length - 1, 0)}</strong>
          <span>Possible new chats</span>
        </div>
      </section>

      <div className="users-grid">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((item) => (
            <article
              key={item.email}
              className="user-card rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl"
            >
              <div className="user-card-header">
                <img
                  src={item.photo || "/like.png"}
                  alt={item.name}
                  className="user-card-avatar"
                />
                <span className="user-card-badge inline-flex items-center gap-2">
                  <IonIcon name="sparkles-outline" className="text-sm" />
                  CatPost member
                </span>
              </div>

              <div className="user-card-copy">
                <h3>{item.name || "Cat User"}</h3>
                <p>{item.email}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IonIcon name="radio-button-on" className="text-sm text-emerald-500" />
                Available to chat
              </div>

              <button
                type="button"
                onClick={() => onOpenChat?.(item)}
                className="button-primary user-card-button inline-flex items-center justify-center gap-2"
              >
                <IonIcon name="chatbubble-ellipses-outline" className="text-base" />
                Message user
              </button>
            </article>
          ))
        ) : (
          <div className="feed-empty">No users found yet.</div>
        )}
      </div>
    </div>
  );
}

export default Users;
