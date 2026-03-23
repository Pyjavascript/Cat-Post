import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  getAuth,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { buildApiUrl } from "../api";
import { monitorAuthState, syncAuthProfile } from "../firebase/index";

function Account() {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = monitorAuthState((currentUser) => {
      setUser(currentUser);
      setProfileName(currentUser?.displayName || "");
      setProfilePhoto(currentUser?.photoURL || "");
    });

    return unsubscribe;
  }, []);

  const reauthenticateUser = async (password) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !password) {
      throw new Error("Reauthentication cancelled");
    }

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  };

  const reauthenticateWithGoogle = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    await reauthenticateWithPopup(auth.currentUser, provider);
  };

  const deleteCurrentUser = async () => {
    if (!user) {
      return;
    }

    try {
      const auth = getAuth();

      if (user.providerData[0]?.providerId === "password") {
        const password = prompt("Enter your password to confirm account deletion:");
        await reauthenticateUser(password);
      } else if (user.providerData[0]?.providerId === "google.com") {
        await reauthenticateWithGoogle();
      }

      await fetch(buildApiUrl("/delete"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      await deleteUser(auth.currentUser);
      navigate("/");
    } catch (error) {
      console.error("Error deleting user:", error.message);
      setStatus("Could not delete account right now.");
    }
  };

  const editProfile = async () => {
    if (!user?.email) {
      return;
    }

    try {
      setStatus("Saving profile...");
      const response = await fetch(buildApiUrl("/update"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: profileName,
          photo: profilePhoto,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await syncAuthProfile({
        displayName: profileName,
        photoURL: profilePhoto,
      });

      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              displayName: profileName,
              photoURL: profilePhoto,
            }
          : currentUser
      );
      setStatus("Profile updated.");
    } catch (error) {
      console.error("Profile update failed:", error);
      setStatus("Profile update failed.");
    }
  };

  return (
    <div className="min-h-full bg-white p-4 md:px-8">
      <div className="border-b-2 border-dashed border-slate-300 py-4">
        <h1 className="text-3xl font-extrabold text-black">Account</h1>
      </div>

      <div className="py-6">
        <div className="flex flex-col items-center justify-center gap-2">
          <img
            src={user?.photoURL || "/like.png"}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover"
          />
          <h1 className="text-xl font-bold text-black">{user?.displayName}</h1>
          <h2 className="text-sm text-slate-500">{user?.email}</h2>
        </div>

        <div className="mt-8 grid gap-4">
          <input
            type="text"
            className="simple-input px-4 py-3"
            placeholder="Display name"
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
          />
          <input
            type="url"
            className="simple-input px-4 py-3"
            placeholder="Profile photo URL"
            value={profilePhoto}
            onChange={(event) => setProfilePhoto(event.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={editProfile}
            className="bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            Save Profile
          </button>
          <button
            type="button"
            onClick={deleteCurrentUser}
            className="bg-red-400 px-5 py-3 text-sm font-bold text-white transition hover:bg-black"
          >
            Delete Account
          </button>
        </div>

        {status ? <p className="mt-4 text-sm text-slate-500">{status}</p> : null}
      </div>
    </div>
  );
}

export default Account;
