import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../api";
import {
  Login,
  SignWithGoogle,
  createUser,
  syncAuthProfile,
} from "../firebase/index";

function Register() {
  const navigate = useNavigate();
  const [Firstname, SetFirstName] = useState("");
  const [Lastname, SetLastName] = useState("");
  const [Email, SetEmail] = useState("");
  const [Password, SetPassword] = useState("");
  const [login, Setlogin] = useState(false);
  const [load, SetLoad] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreate = async () => {
    SetLoad(true);
    setErrorMessage("");

    if (login) {
      try {
        await Login(Email, Password);
        navigate("/Home");
      } catch (error) {
        console.error("Login failed", error);
        setErrorMessage("Login failed. Check your email and password.");
      } finally {
        SetLoad(false);
      }
      return;
    }

    try {
      const user = await createUser(Email, Password);
      const uid = user.uid;
      const displayName = `${Firstname} ${Lastname}`.trim();

      await syncAuthProfile({ displayName });

      const response = await fetch(buildApiUrl("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: Email,
          displayName,
          uid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save user to backend");
      }

      navigate("/Home");
    } catch (error) {
      console.error(error);
      setErrorMessage("Signup failed. Please try again.");
    } finally {
      SetLoad(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const user = await SignWithGoogle();

      if (!user) {
        return;
      }

      const response = await fetch(buildApiUrl("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register Google user");
      }

      navigate("/Home");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setErrorMessage("Google sign-in failed.");
    }
  };

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-white">
      <div className="hidden h-screen w-1/2 flex-col justify-center bg-slate-100 p-10 md:flex">
        <div className="flex items-center gap-6">
          <div className="w-24">
            <img src="/like.png" className="w-full" alt="" />
          </div>
          <h1 className="text-8xl font-extrabold leading-none text-black">Post</h1>
        </div>
        <p className="mt-8 max-w-lg text-lg leading-8 text-slate-500">
          Share posts, chat with friends, and keep your community active.
        </p>
      </div>

      <div className="relative flex h-screen w-screen flex-col justify-center gap-5 p-5 px-10 md:w-1/2">
        <div className="absolute top-5">
          <img src="/like.png" className="w-10" alt="" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-black">
            {!login ? "Create an account" : "Login to your account"}
          </h1>
          <p className="text-slate-400">
            {login ? "Need an account?" : "Already here?"}{" "}
            <a
              onClick={() => Setlogin((prev) => !prev)}
              href="#"
              className="text-blue-400"
            >
              {!login ? "Login" : "Sign Up"}
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            {!login ? (
              <>
                <input
                  className="w-1/2 bg-slate-200 p-3 outline-none"
                  type="text"
                  placeholder="First name"
                  onChange={(event) => SetFirstName(event.target.value)}
                />
                <input
                  className="w-1/2 bg-slate-200 p-3 outline-none"
                  type="text"
                  placeholder="Last name"
                  onChange={(event) => SetLastName(event.target.value)}
                />
              </>
            ) : null}
          </div>
          <input
            type="email"
            className="w-full bg-slate-200 p-3 outline-none"
            placeholder="example@gmail.com"
            onChange={(event) => SetEmail(event.target.value)}
          />
          <input
            className="w-full bg-slate-200 p-3 outline-none"
            type="password"
            placeholder="Enter your password"
            onChange={(event) => SetPassword(event.target.value)}
          />

          <button
            className="w-full cursor-pointer bg-black py-3 text-white"
            onClick={handleCreate}
          >
            {!load ? (!login ? "Create an account" : "Login Account") : "Loading..."}
          </button>
        </div>
        {errorMessage ? <p className="text-sm text-rose-500">{errorMessage}</p> : null}
        <div
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 border-2 border-slate-200 px-4"
          onClick={handleGoogle}
        >
          <img src="/google.svg" alt="" className="h-[100%]" />
          <p>Sign in with Google</p>
        </div>
      </div>
    </main>
  );
}

export default Register;
