import { useState, useEffect } from "react";
import { monitorAuthState } from "../firebase/index";
import { useNavigate } from "react-router-dom"; 
import { 
  getAuth, 
  deleteUser, 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  GoogleAuthProvider, 
  reauthenticateWithPopup 
} from "firebase/auth";

function Account() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    monitorAuthState((currentUser) => {
      setUser(currentUser);
      console.log("User:", currentUser);
    });
  }, []);

  // Reauthenticate User (For Email/Password Login)
  const reauthenticateUser = async (password) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log("No user is signed in.");
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    
    try {
      await reauthenticateWithCredential(user, credential);
      console.log("Reauthentication successful");
    } catch (error) {
      console.error("Reauthentication failed:", error.message);
      throw error;
    }
  };

  // Reauthenticate User (For Google Sign-In)
  const reauthenticateWithGoogle = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      await reauthenticateWithPopup(auth.currentUser, provider);
      console.log("Reauthenticated with Google");
    } catch (error) {
      console.error("Google Reauthentication failed:", error.message);
      throw error;
    }
  };

  // Delete User Function
  const deleteuser = async () => {
    if (!user) {
      console.log("No user found.");
      return;
    }

    try {
      const auth = getAuth();

      // Check if user signed in with Email/Password or Google
      if (user.providerData[0].providerId === "password") {
        const password = prompt("Enter your password to confirm account deletion:");
        await reauthenticateUser(password);
      } else if (user.providerData[0].providerId === "google.com") {
        await reauthenticateWithGoogle();
      }

      // Send request to backend to delete user data
      const response = await fetch("https://cat-post.onrender.com/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      console.log("Backend Response:", data);

      // Delete user from Firebase Authentication
      await deleteUser(auth.currentUser);
      
      console.log("User deleted successfully from Firebase");
      navigate
        ? navigate("/")
        : console.log("No navigation object found.");
      

    } catch (error) {
      console.log("Error deleting user:", error.message);
    }
  };
  function EditProfile() {
    fetch("https://cat-post.onrender.com/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        name: "New Name",
        photo: "New Photo",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Updated User:", data);
    })
  }

  return (
    <div className="h-full w-full bg-white">
      <div className="w-full">
        <div className="flex flex-col items-center justify-center gap-2 pt-2">
          <img
            src={user?.photoURL ? user.photoURL : "/like.png"}
            alt="Profile"
            className="w-20 h-20 rounded-full"
          />
          <h1 className="text-lg font-bold">{user?.displayName}</h1>
          <h1 className="text-lg font-bold">{user?.email}</h1>
        </div>
        <div className="w-full p-4 flex flex-col gap-2">
          <div className="font-bold text-lg border-b-2 border-gray-300 border-dashed py-3 flex justify-between items-center" onClick={EditProfile}>
            <p>Edit Profile</p>
            <div className="flex justify-between items-center text-2xl">
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </div>
          </div>
          <div className="text-red-500 font-bold text-lg border-b-2 border-gray-300 border-dashed py-3 flex justify-between items-center" onClick={deleteuser}>
            <p>Delete Account</p>
            <div className="flex justify-between items-center text-2xl">
              <ion-icon name="trash-outline"></ion-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
