import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignWithGoogle, createUser, Login } from "../firebase/index";

function Register() {
  const navigate = useNavigate();
  const [Firstname, SetFirstName] = useState("");
  const [Lastname, SetLastName] = useState("");
  const [Email, SetEmail] = useState("");
  const [Password, SetPassword] = useState("");
  const [login, Setlogin] = useState(false);
  const [load, SetLoad] = useState(false);

  const handleCreate = async () => {
    SetLoad(true);
    if (login) {
      try {
        await Login(Email, Password);
        navigate("/Home");
      } catch (error) {
        console.error("Login failed", error);
      } finally {
        SetLoad(false);
      }
    }
    else {
      try {
        const user = await createUser(Email, Password);
        const uid = user.uid;
        const userinfo = {
          firstname: Firstname,
          lastname: Lastname,
          displayName: Firstname + " " + Lastname,
          email: Email,
          password: Password,
        };
        console.log(userinfo);
        console.log("User Created in Firebase:", user, uid);

        const response = await fetch("https://cat-post-1.onrender.com/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userinfo.email,
            displayName: userinfo.displayName,
            uid: uid,
          }),
        });
        if (response.ok) {
          console.log("User saved to backend");
          navigate("/Home");
        } else {
          SetLoad(false);
          console.error("Failed to save user to backend");
        }
      } catch (e) {
        SetLoad(false);
        console.log(e);
      }
    }
  };
  const handleGoogle = async () => {
  try {
    const user = await SignWithGoogle();
    if (!user) return;
    const uid = user.uid;
    const userPayload = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: uid,
    };
    const response = await fetch("https://cat-post-1.onrender.com/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload),
    });

    if (response.ok) {
      console.log("User registered successfully");
      navigate("/Home");
    } else {
      console.error("Failed to register user");
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
  }
};


  // bg-[url(src/assets/bg.webp)]
  return (
    <>
      <main className="flex justify-center items-center h-screen w-screen bg-white">
        <div className="w-1/2 bg-slate-100 h-screen bg-center hidden md:flex flex-col justify-center items-center p-4">
          <div className="flex justify-center items-center w-full">
            <div className="w-40 flex justify-center items-center">
              <img src="/like.png" className="w-full" alt="" />
            </div>
            <h1 className="text-[13rem] font-extrabold text-black">Post</h1>
          </div>
        </div>

        <div className="p-5 px-10 box flex flex-col justify-center gap-5 h-screen w-screen md:w-1/2 relative">
          <div className="absolute top-5">
            <img src="/like.png" className="w-10" alt="" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-3xl text-black">
              {!login ? "Create an accout" : "Login to your account"}
            </h1>
            <p className="text-slate-400">
              Create an account?{" "}
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
                    className="bg-slate-200 p-2 w-1/2  outline-none"
                    type="text"
                    placeholder="First name"
                    onChange={(e) => SetFirstName(e.target.value)}
                  />
                  <input
                    className="bg-slate-200 p-2 w-1/2 outline-none"
                    type="text"
                    placeholder="Last name"
                    onChange={(e) => SetLastName(e.target.value)}
                  />
                </>
              ) : (
                ""
              )}
            </div>
            <input
              type="email"
              className="bg-slate-200 p-2 w-full outline-none"
              placeholder="example@gmail.com"
              onChange={(e) => SetEmail(e.target.value)}
            />
            <input
              className="outline-none bg-slate-200 p-2 w-full"
              type="password"
              placeholder="Enter your password"
              onChange={(e) => SetPassword(e.target.value)}
            />

            <button
              className="w-full bg-black py-2 text-white cursor-pointer"
              onClick={handleCreate}
            >
              {!load
                ? !login
                  ? "Create an accout"
                  : "Login Account"
                : "Loading..."}
            </button>
          </div>
          <div
            className="h-10 cursor-pointer w-full border-2 border-slate-200 flex justify-center items-center px-4"
            onClick={handleGoogle}
          >
            <img src="/google.svg" alt="" className="h-[100%]" />
            <p>Sign in with Google</p>
          </div>
        </div>
      </main>
    </>
  );
}

export default Register;
