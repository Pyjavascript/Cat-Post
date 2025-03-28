import { useState } from "react";
import { Posts, Chat, Users, Account } from "../index";
import {logout} from "../firebase/index"
import { useNavigate } from "react-router-dom";

function Home() {
  const [page, SetPage] = useState("");
  const navigate = useNavigate();

  const handlelout = () => {
    logout();
    navigate("/register")
  }
  return (
    <>
      <div className="mainpage w-screen h-screen md:p-5 md:px-96 overflow-x-hidden">
        <div className="w-full border-b-2 border-gray-300 border-dashed">
          <div className="flex md:flex-row flex-col justify-between w-full p-1">
            <div className="w-full flex justify-between items-center px-2">
              <img src="/like.png" className="w-10" alt="" />
              <button onClick={handlelout} className="bg-red-400 text-white font-bold p-1 px-3 rounded-full cursor-pointer hover:bg-black transition-all">Logout</button>
            </div>
            <div className="flex gap-3">
              <h1
                className="cursor-pointer hover:text-[1.2rem] transition-all hover:border-b-2 p-2 flex justify-center items-center"
                onClick={() => SetPage("post")}
              >
                Posts
              </h1>
              <h1
                className="cursor-pointer hover:text-[1.2rem] transition-all hover:border-b-2 p-2 flex justify-center items-center"
                onClick={() => SetPage("chat")}
              >
                Chat
              </h1>
              <h1
                className="cursor-pointer hover:text-[1.2rem] transition-all hover:border-b-2 p-2 flex justify-center items-center"
                onClick={() => SetPage("Users")}
              >
                Users
              </h1>
              <h1
                className="cursor-pointer hover:text-[1.2rem] transition-all hover:border-b-2 p-2 flex justify-center items-center"
                onClick={() => SetPage("account")}
              >
                Account
              </h1>
            </div>
          </div>
        </div>
        {/* pages */}
        <div className="w-full h-full">
          {(() => {
            switch (page) {
              case "post":
                return <Posts />;
              case "chat":
                return <Chat />;
              case "Users":
                return <Users />;
              case "account":
                return <Account />;
              default:
                return <Posts />; // Default page (optional)
            }
          })()}
        </div>
      </div>
    </>
  );
}

export default Home;
