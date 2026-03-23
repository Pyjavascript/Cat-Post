import { useEffect, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import AudioRecorder from "./AudioRecorder";
import { monitorAuthState } from "../firebase/index";
import { IMGBB_API_KEY, buildApiUrl, resolveMediaUrl } from "../api";

function Posts() {
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [imgURL, setImgURL] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState("");
  const [animatedLikePostId, setAnimatedLikePostId] = useState("");

  useEffect(() => {
    const unsubscribe = monitorAuthState((currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl("/posts"));

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setStatus("Could not load the feed right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setImageFileName(file.name);
    setIsUploading(true);
    setStatus("Uploading image...");

    const formData = new FormData();
    formData.set("image", file);

    try {
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );
      setImgURL(response.data.data.display_url);
      setStatus("Image uploaded successfully.");
    } catch (error) {
      console.error("Image upload failed:", error);
      setStatus("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePost = async () => {
    if (!user) {
      return;
    }

    if (!text.trim() && !imgURL && !videoURL.trim() && !audioBlob) {
      setStatus("Add some text, image, video, or audio before posting.");
      return;
    }

    const formData = new FormData();
    formData.append("text", text.trim());
    formData.append("img", imgURL);
    formData.append("video", videoURL.trim());
    formData.append("userId", user.uid);
    formData.append("postId", uuidv4());
    formData.append("user", user.email);
    formData.append("userName", user.displayName || "Cat User");
    formData.append("userPhoto", user.photoURL || "");

    if (audioBlob) {
      formData.append(
        "audio",
        new File([audioBlob], "voice-message.webm", { type: "audio/webm" })
      );
    }

    try {
      setPosting(true);
      setStatus("Publishing post...");
      const response = await fetch(buildApiUrl("/post"), {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Post failed");
      }

      setText("");
      setImgURL("");
      setImageFileName("");
      setVideoURL("");
      setAudioBlob(null);
      setStatus("Post published.");
      await fetchPosts();
    } catch (error) {
      console.error("Error posting data:", error);
      setStatus(error.message || "Posting failed.");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user?.email) {
      return;
    }

    try {
      setAnimatedLikePostId(postId);
      const response = await fetch(buildApiUrl(`/posts/${postId}/like`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to like post");
      }

      const data = await response.json();
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.postId === postId ? data.data : post))
      );
    } catch (error) {
      console.error("Error liking post:", error);
      setStatus("Could not update like right now.");
    } finally {
      window.setTimeout(() => {
        setAnimatedLikePostId((currentId) => (currentId === postId ? "" : currentId));
      }, 400);
    }
  };

  const formatPostTime = (value) => {
    if (!value) {
      return "Just now";
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime())
      ? "Just now"
      : parsedDate.toLocaleString();
  };

  const renderPostMedia = (item) => {
    if (item.img) {
      return (
        <img
          src={resolveMediaUrl(item.img)}
          alt="Post"
          className="feed-media"
        />
      );
    }

    if (item.video) {
      return (
        <video
          controls
          className="feed-media bg-black"
          src={resolveMediaUrl(item.video)}
        />
      );
    }

    if (item.audioFile) {
      return <audio controls src={resolveMediaUrl(item.audioFile)} className="w-full" />;
    }

    return null;
  };

  return (
    <div className="dashboard-feed">
      <div className="feed-layout">
        <section className="feed-main">
          <div className="composer-card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Feed
                </p>
                <h2 className="text-3xl font-extrabold text-black">Posts</h2>
              </div>
              <p className="composer-meta">{posts.length} posts</p>
            </div>

            <div className="flex gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                <img
                  src={user?.photoURL || "/like.png"}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <textarea
                  className="composer-textarea"
                  placeholder="What's happening in your community?"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />

                <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_1fr]">
                  <label className="upload-control">
                    <div className="upload-control-left">
                      <div className="upload-icon-wrap">
                        <img src="/uploadImg.png" alt="" className="h-5 w-5 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {isUploading ? "Uploading image..." : "Choose file"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {imageFileName || "Select an image for your post"}
                        </p>
                      </div>
                    </div>
                    <span className="upload-chip">Browse</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <input
                    type="url"
                    className="simple-input px-4 py-3 text-sm"
                    placeholder="Paste video URL"
                    value={videoURL}
                    onChange={(event) => setVideoURL(event.target.value)}
                  />
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="md:w-[55%]">
                    <AudioRecorder onRecorded={setAudioBlob} disabled={posting} />
                  </div>
                  <button
                    type="button"
                    onClick={handlePost}
                    disabled={posting || isUploading}
                    className="publish-button"
                  >
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>

                {imgURL ? (
                  <div className="preview-card">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Image Preview
                    </p>
                    <img src={imgURL} alt="Preview" className="preview-image" />
                  </div>
                ) : null}

                {status ? <p className="mt-3 text-sm text-slate-500">{status}</p> : null}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-5">
            {loading ? (
              <div className="feed-empty">Loading posts...</div>
            ) : posts.length > 0 ? (
              posts.map((item) => {
                const likedByCurrentUser = item.likes?.includes(user?.email || "");

                return (
                  <article key={item.postId} className="feed-card">
                    <div className="flex items-center gap-3 px-4 py-4">
                      <div className="h-11 w-11 overflow-hidden rounded-full bg-slate-200">
                        <img
                          src={item.authorPhoto || "/like.png"}
                          alt={item.authorName || "Author"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-black">{item.authorName || "Cat User"}</p>
                        <p className="text-sm text-slate-500">{item.user}</p>
                      </div>
                      <p className="text-xs text-slate-400">{formatPostTime(item.createdAt)}</p>
                    </div>

                    <div className="space-y-4 px-4 pb-5">
                      {item.text ? (
                        <p className="text-base leading-7 text-slate-700">{item.text}</p>
                      ) : null}

                      {renderPostMedia(item)}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => handleLike(item.postId)}
                          className={`post-heart ${likedByCurrentUser ? "post-heart-active" : ""} ${
                            animatedLikePostId === item.postId ? "like-burst" : ""
                          }`}
                        >
                          <span>{likedByCurrentUser ? "Liked" : "Like"}</span>
                          <span>{item.likes?.length || 0}</span>
                        </button>
                        <p className="text-sm text-slate-400">
                          {item.audioFile ? "Audio" : item.video ? "Video" : item.img ? "Image" : "Text"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="feed-empty">
                <p className="text-xl font-bold text-slate-800">No posts available</p>
                <p className="max-w-md text-sm text-slate-500">
                  Start with a text post, image, video, or voice note.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="feed-sidebar">
          <div className="sidebar-card">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Your Space
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-200">
                <img
                  src={user?.photoURL || "/like.png"}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-black">{user?.displayName || "Cat User"}</p>
                <p className="truncate text-sm text-slate-500">{user?.email || "Loading..."}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="sidebar-stat">
                <span className="sidebar-stat-value">{posts.length}</span>
                <span className="sidebar-stat-label">Posts</span>
              </div>
              <div className="sidebar-stat">
                <span className="sidebar-stat-value">
                  {posts.reduce((count, item) => count + (item.likes?.length || 0), 0)}
                </span>
                <span className="sidebar-stat-label">Likes</span>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Posting Tips
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Lead with a strong visual to make the feed pop.</li>
              <li>Keep captions short so the dashboard stays clean.</li>
              <li>Use a voice note when you want the post to feel personal.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Posts;
