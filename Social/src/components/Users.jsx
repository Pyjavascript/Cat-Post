import { useEffect, useState } from "react";
import { buildApiUrl } from "../api";
import { monitorAuthState } from "../firebase/index";

function Users({ onOpenChat }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

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

  return (
    <div className="min-h-full bg-white p-4 md:px-8">
      <div className="border-b-2 border-dashed border-slate-300 py-4">
        <h1 className="text-3xl font-extrabold text-black">All Users</h1>
        <p className="text-sm text-slate-500">{users.length} users</p>
      </div>

      <div className="py-4">
        {users.length > 0 ? (
          users.map((item) => (
            <div
              key={item.email}
              className="flex flex-col gap-4 border-b-2 border-dashed border-slate-300 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.photo || "/like.png"}
                  alt={item.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-black">{item.name}</h2>
                  <p className="truncate text-sm text-slate-500">{item.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChat?.(item)}
                className="bg-black px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                Message
              </button>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-slate-500">No users found yet.</div>
        )}
      </div>
    </div>
  );
}

export default Users;
