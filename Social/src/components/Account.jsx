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
import IonIcon from "./IonIcon";

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

  const providerId = user?.providerData?.[0]?.providerId;
  const providerLabel = providerId === "google.com" ? "Google" : "Email and password";
  const photoPreview = profilePhoto || user?.photoURL || "/like.png";

  return (
    <div className="account-shell">
      <section className="account-hero rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="account-hero-profile">
          <img src={photoPreview} alt="Profile" className="account-avatar" />
          <div>
            <p className="section-label">Profile</p>
            <h2>{profileName || user?.displayName || "Cat User"}</h2>
            <p>{user?.email || "Loading account..."}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={editProfile}
          className="button-primary inline-flex items-center gap-2"
        >
          <IonIcon name="save-outline" className="text-base" />
          Save changes
        </button>
      </section>

      <div className="account-grid">
        <section className="account-card rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <p className="section-label">Edit details</p>
          <div className="account-form-stack">
            <input
              type="text"
              className="simple-input account-input"
              placeholder="Display name"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
            />
            <input
              type="url"
              className="simple-input account-input"
              placeholder="Profile photo URL"
              value={profilePhoto}
              onChange={(event) => setProfilePhoto(event.target.value)}
            />
          </div>

          {status ? (
            <p
              className={`account-status ${
                status.toLowerCase().includes("failed") ? "account-status-danger" : ""
              }`}
            >
              {status}
            </p>
          ) : null}
        </section>

        <section className="account-card rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <p className="section-label">Account snapshot</p>
          <div className="account-summary-list">
            <div className="account-summary-item">
              <IonIcon name="person-outline" className="text-lg text-slate-500" />
              <span>Display name</span>
              <strong>{profileName || "Not set"}</strong>
            </div>
            <div className="account-summary-item">
              <IonIcon name="mail-outline" className="text-lg text-slate-500" />
              <span>Email</span>
              <strong>{user?.email || "Loading..."}</strong>
            </div>
            <div className="account-summary-item">
              <IonIcon name="shield-checkmark-outline" className="text-lg text-slate-500" />
              <span>Sign-in method</span>
              <strong>{providerLabel}</strong>
            </div>
          </div>
        </section>

        <section className="account-card account-danger-card rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <p className="section-label">Danger zone</p>
          <h3>Delete this account</h3>
          <p className="account-danger-copy">
            This removes your CatPost account and signs you out. Reauthentication may be required.
          </p>
          <button
            type="button"
            onClick={deleteCurrentUser}
            className="button-danger inline-flex items-center gap-2"
          >
            <IonIcon name="trash-outline" className="text-base" />
            Delete account
          </button>
        </section>
      </div>
    </div>
  );
}

export default Account;
