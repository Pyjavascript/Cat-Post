import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import AudioRecorder from "./AudioRecorder";
import IonIcon from "./IonIcon";
import { monitorAuthState } from "../firebase/index";
import { IMGBB_API_KEY, buildApiUrl, resolveMediaUrl } from "../api";

const composerActions = [
  { label: "Go Live", icon: "videocam-outline", tone: "text-orange-400" },
  { label: "Photo", icon: "image-outline", tone: "text-emerald-500" },
  { label: "Video", icon: "logo-youtube", tone: "text-pink-500" },
  { label: "Feeling", icon: "happy-outline", tone: "text-sky-500" },
];

const birthdays = [
  "Pola Foster",
  "Annalise Hane",
  "Alex Kai",
];

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
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [copiedPostId, setCopiedPostId] = useState("");

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
      const sortedPosts = [...data].sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });
      setPosts(sortedPosts);
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

  const handleShare = async (item) => {
    const shareText = `${item.authorName || "Cat User"} on CatPost: ${item.text || "New post"}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "CatPost", text: shareText });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }

      setCopiedPostId(item.postId);
      window.setTimeout(() => {
        setCopiedPostId((currentId) => (currentId === item.postId ? "" : currentId));
      }, 1800);
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const handleToggleSave = (postId) => {
    setSavedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]
    );
  };

  const formatPostTime = (value) => {
    if (!value) {
      return "Just now";
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime())
      ? "Just now"
      : parsedDate.toLocaleString([], {
          hour: "numeric",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        });
  };

  const renderPostMedia = (item) => {
    if (item.img) {
      return (
        <img
          src={resolveMediaUrl(item.img)}
          alt="Post"
          className="max-h-[26rem] w-full rounded-xl object-cover"
        />
      );
    }

    if (item.video) {
      return (
        <video
          controls
          className="max-h-[26rem] w-full rounded-xl bg-black object-cover"
          src={resolveMediaUrl(item.video)}
        />
      );
    }

    if (item.audioFile) {
      return <audio controls src={resolveMediaUrl(item.audioFile)} className="w-full" />;
    }

    return null;
  };

  const featuredCreators = useMemo(() => {
    const creators = [];

    posts.forEach((item) => {
      if (
        item.user &&
        !creators.some((creator) => creator.email === item.user) &&
        creators.length < 8
      ) {
        creators.push({
          email: item.user,
          name: item.authorName || "Cat User",
          photo: item.authorPhoto || "/like.png",
        });
      }
    });

    return creators;
  }, [posts]);

  const latestActivity = useMemo(
    () =>
      posts.slice(0, 3).map((item) => ({
        id: item.postId,
        photo: item.authorPhoto || "/like.png",
        title: `${item.authorName || "Cat User"} added a ${item.img ? "photo" : item.video ? "video" : item.audioFile ? "voice note" : "post"}`,
        time: formatPostTime(item.createdAt),
      })),
    [posts]
  );

  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_15rem]">
      <section className="min-w-0 space-y-2">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/95 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <img
              src={user?.photoURL || "/like.png"}
              alt={user?.displayName || "Profile"}
              className="h-11 w-11 rounded-full object-cover"
            />
            <textarea
              className="min-h-[3.25rem] flex-1 resize-none rounded-full bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="What on your mind?"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {composerActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <IonIcon name={action.icon} className={`text-lg ${action.tone}`} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <IonIcon name="image-outline" className="text-lg" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {isUploading ? "Uploading image..." : imageFileName || "Choose photo"}
                    </p>
                    <p className="text-xs text-slate-500">Attach an image</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                  Browse
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-400">
                <IonIcon name="link-outline" className="text-lg" />
                <input
                  type="url"
                  value={videoURL}
                  onChange={(event) => setVideoURL(event.target.value)}
                  placeholder="Paste video URL"
                  className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <AudioRecorder onRecorded={setAudioBlob} disabled={posting || isUploading} />

              <button
                type="button"
                onClick={handlePost}
                disabled={posting || isUploading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1d235c] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IonIcon name="paper-plane-outline" className="text-base" />
                {posting ? "Posting..." : "Publish"}
              </button>
            </div>

            {imgURL ? (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <img src={imgURL} alt="Preview" className="max-h-52 w-full rounded-xl object-cover" />
              </div>
            ) : null}

            {status ? <p className="mt-3 text-sm text-slate-500">{status}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="rounded-[1.5rem] border border-white/80 bg-white/95 p-8 text-center text-slate-500 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
              Loading posts...
            </div>
          ) : posts.length > 0 ? (
            posts.map((item) => {
              const likedByCurrentUser = item.likes?.includes(user?.email || "");
              const isSaved = savedPostIds.includes(item.postId);

              return (
                <article
                  key={item.postId}
                  className="rounded-[1.5rem] border border-white/80 bg-white/95 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.authorPhoto || "/like.png"}
                        alt={item.authorName || "Author"}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {item.authorName || "Cat User"}
                        </p>
                        <p className="text-xs text-slate-500">{formatPostTime(item.createdAt)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                    >
                      <IonIcon name="ellipsis-vertical" className="text-base" />
                    </button>
                  </div>

                  {item.text ? (
                    <p className="mt-3 text-sm leading-6 text-slate-700">{item.text}</p>
                  ) : null}

                  <div className="mt-3">{renderPostMedia(item)}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <IonIcon name="heart" className="text-base text-rose-500" />
                      {item.likes?.length || 0}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <IonIcon name="chatbubble" className="text-base text-sky-500" />
                      200
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <IonIcon name="share-social-outline" className="text-base text-amber-500" />
                      17
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleLike(item.postId)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                        likedByCurrentUser
                          ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                          : "bg-rose-50 text-rose-500 hover:bg-rose-100"
                      } ${animatedLikePostId === item.postId ? "like-burst" : ""}`}
                    >
                      <IonIcon
                        name={likedByCurrentUser ? "heart" : "heart-outline"}
                        className="text-base"
                      />
                      <span>{likedByCurrentUser ? "Liked" : "Like"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(item)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
                    >
                      <IonIcon name="share-social-outline" className="text-base" />
                      Share
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSave(item.postId)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                        isSaved
                          ? "bg-sky-100 text-sky-600"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <IonIcon
                        name={isSaved ? "bookmark" : "bookmark-outline"}
                        className="text-base"
                      />
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                    <img
                      src={user?.photoURL || "/like.png"}
                      alt={user?.displayName || "Profile"}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div className="flex flex-1 items-center justify-between rounded-full bg-slate-100 px-4 py-2">
                      <span className="text-sm text-slate-400">Write your comment</span>
                      <div className="flex items-center gap-2 text-slate-400">
                        <IonIcon name="camera-outline" className="text-base" />
                        <IonIcon name="happy-outline" className="text-base" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {item.authorName || "Cat User"}
                    </span>{" "}
                    shared an update with the community.
                    {copiedPostId === item.postId ? " Copied for sharing." : ""}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-white/80 bg-white/95 p-8 text-center shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
              <p className="text-lg font-bold text-slate-900">No posts available</p>
              <p className="mt-2 text-sm text-slate-500">
                Start with a text post, image, video, or voice note.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-2">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/95 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#1d235c]">Birthdays 🎂</p>
              <p className="mt-1 text-sm text-slate-600">
                {birthdays[0]} and 3 other friends have birthday today
              </p>
            </div>
            <button type="button" className="text-slate-400">
              <IonIcon name="close-outline" className="text-base" />
            </button>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/80 bg-white/95 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-bold text-[#1d235c]">Latest Activity</p>
          <div className="mt-4 space-y-3">
            {latestActivity.length > 0 ? (
              latestActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <img
                    src={activity.photo}
                    alt={activity.title}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">{activity.title}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Activity will show up here once the feed is active.</p>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/80 bg-white/95 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-bold text-[#1d235c]">Active Friends</p>
          <div className="mt-4 space-y-3">
            {featuredCreators.length > 0 ? (
              featuredCreators.map((creator) => (
                <div key={creator.email} className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={creator.photo}
                      alt={creator.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <span className="truncate text-sm text-slate-700">{creator.name}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Friends will appear here once people start posting.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Posts;
