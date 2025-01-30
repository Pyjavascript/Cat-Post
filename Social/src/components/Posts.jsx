import { useState, useEffect } from "react";
import { monitorAuthState } from "../firebase/index";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

function Posts() {
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [imgURL, setImgURL] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [post, setPost] = useState([]);
  const [loading, setLoading] = useState(true);

  // Monitor user authentication state
  useEffect(() => {
    monitorAuthState((currentUser) => {
      setUser(currentUser);
      console.log("User:", currentUser);
    });

    const cachedPosts = JSON.parse(localStorage.getItem("posts"));
    if (cachedPosts) {
      setPost(cachedPosts);
    }
  }, []);

  // Fetch posts when user is available
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.set("image", file);

    try {
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=98257fe3ec3403ba357fa7640e88fb49`,
        formData
      );
      const imageUrl = response.data.data.display_url;
      setImgURL(imageUrl);
      console.log("Image uploaded successfully:", imageUrl);
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://cat-post.onrender.com/posts?user=${user?.email}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      setPost(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const newPost = {
      text: text,
      img: imgURL,
      userId: user.uid,
      postId: uuidv4(),
      user: user.email,
    };

    try {
      const response = await fetch("https://cat-post.onrender.com/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        console.log("Post saved to backend");
        setText("");
        setImgURL("");
        fetchPosts();
      } else {
        console.error("Failed to save post to backend");
      }
    } catch (error) {
      console.error("Error posting data:", error);
    }
  };

  return (
    <div className="h-full w-full bg-white">
      {/* Create Post Section */}
      <div className="w-full bg-white flex gap-2 p-3 border-b-2 border-dashed border-slate-300">
        <div className="flex justify-center items-center overflow-hidden h-10 w-10 bg-slate-300 rounded-full">
          <img
            src={user?.photoURL ? user.photoURL : "src/assets/like.png"}
            alt="img"
            className="h-full"
            onError={(e) => (e.target.src = "/like.png")}
          />
        </div>
        <div className="w-[63%] flex flex-col gap-2">
          <input
            type="text"
            className="text-[1.2rem] outline-none p-1"
            placeholder="Create a post"
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
          <div className="text-2xl flex gap-2">
            <label htmlFor="file">
              {isUploading ? (
                <div className="text-blue-500 animate-pulse">
                  <ion-icon name="image-outline"></ion-icon>
                </div>
              ) : (
                <ion-icon name="image-outline"></ion-icon>
              )}
            </label>
            <input type="file" id="file" hidden onChange={handleImageUpload} />
          </div>
        </div>
        <div className="flex items-end md:ml-30">
          <button
            onClick={handlePost}
            className="bg-black text-white p-1 px-3 rounded-2xl text-[.8rem] cursor-pointer"
          >
            Post
          </button>
        </div>
      </div>

      {/* Posts Display Section */}
      <div className="flex flex-col">
        {loading ? (
          <p>Loading posts...</p>
        ) : post.length > 0 ? (
          post.map((elem, ind) => (
            <div key={ind}>
              <div className="w-full p-3 flex justify-normal items-center gap-2">
                <div className="w-8 h-8 bg-slate-300 rounded-full overflow-hidden">
                  <img src={user?.photoURL ? user.photoURL : "/like.png"} alt="" />
                </div>
                <p className="font-bold"> {user?.displayName ? user.displayName : "Cat"}</p>
              </div>
              <div
                key={ind}
                className="border-b-2 border-dashed border-slate-300"
              >
                {elem.File && (
                  <img src={elem.File} alt="Post" className="w-full md:w-1/2" />
                )}
                <p className="pl-3 pb-2"><span className="font-bold">Post:</span> {elem.Text}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No posts available</p>
        )}
      </div>
    </div>
  );
}

export default Posts;
