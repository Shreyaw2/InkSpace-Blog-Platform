import { useEffect, useState } from "react";
import API from "./api";
import "./App.css";

const categories = [
  "All",
  "Technology",
  "Lifestyle",
  "Education",
  "Travel",
  "Personal",
  "Other",
];

function App() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [authMode, setAuthMode] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const emptyPost = {
    title: "",
    excerpt: "",
    content: "",
    category: "Technology",
  };

  const [postForm, setPostForm] = useState(emptyPost);

  // Fetch all published posts
  const fetchPosts = async () => {
    try {
      const response = await API.get("/posts");
      const data = response.data;

setPosts(
  Array.isArray(data)
    ? data
    : Array.isArray(data?.posts)
      ? data.posts
      : Array.isArray(data?.data)
        ? data.data
        : []
);
    } catch (error) {
      console.error("Unable to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Restore login session and fetch posts
  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem("inkspace_token");

      if (token) {
        try {
          const response = await API.get("/auth/me");
          setUser(response.data.user || response.data);
        } catch {
          localStorage.removeItem("inkspace_token");
          setUser(null);
        }
      }

      await fetchPosts();
    };

    initializeApp();
  }, []);

  // Register or login
  const handleAuth = async (event) => {
    event.preventDefault();

    try {
      const endpoint =
        authMode === "register" ? "/auth/register" : "/auth/login";

      const payload =
        authMode === "register"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const response = await API.post(endpoint, payload);

      localStorage.setItem("inkspace_token", response.data.token);
      setUser(response.data.user);
      setAuthMode("");
      setAuthForm({ name: "", email: "", password: "" });

      alert(
        authMode === "register"
          ? "Account created successfully!"
          : "Welcome back!"
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("inkspace_token");
    setUser(null);
    setSelectedPost(null);
    alert("You have been logged out.");
  };

  // Open create editor
  const openCreateEditor = () => {
    if (!user) {
      setAuthMode("login");
      return;
    }

    setEditingPost(null);
    setPostForm(emptyPost);
    setShowEditor(true);
  };

  // Open edit editor
  const openEditEditor = (post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
    });
    setSelectedPost(null);
    setShowEditor(true);
  };

  // Create or update a post
  const handlePostSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingPost) {
        await API.put(`/posts/${editingPost._id}`, postForm);
        alert("Blog updated successfully!");
      } else {
        await API.post("/posts", postForm);
        alert("Your blog has been published!");
      }

      setShowEditor(false);
      setEditingPost(null);
      setPostForm(emptyPost);
      await fetchPosts();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to save your blog. Please try again."
      );
    }
  };

  // Delete a post
  const handleDelete = async (postId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this blog?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/posts/${postId}`);
      setSelectedPost(null);
      await fetchPosts();
      alert("Blog deleted successfully!");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to delete this blog."
      );
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      category === "All" || post.category === category;

    const searchText = search.toLowerCase();

    const matchesSearch =
      post.title?.toLowerCase().includes(searchText) ||
      post.excerpt?.toLowerCase().includes(searchText) ||
      post.category?.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  const getAuthorName = (post) => {
  return post.author?.name || "InkSpace Author";
};

const isPostOwner = (post) => {
  const authorId =
    typeof post.author === "object"
      ? post.author?._id || post.author?.id
      : post.author;

  const userId = user?._id || user?.id;

  return Boolean(userId && authorId && String(authorId) === String(userId));
};

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo" onClick={() => setSelectedPost(null)}>
          InkSpace<span>.</span>
        </div>

        <nav className="nav-links">
          <button onClick={() => setSelectedPost(null)}>Home</button>
          <button onClick={openCreateEditor}>Write a story</button>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="welcome-text">
                Hi, {user.name || "Writer"}
              </span>
              <button className="auth-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthMode("login")}>
                Log in
              </button>
              <button
                className="auth-button"
                onClick={() => setAuthMode("register")}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        {selectedPost ? (
          <article className="reader">
            <button
              className="back-button"
              onClick={() => setSelectedPost(null)}
            >
              ← Back to stories
            </button>

            <span className="post-category">
              {selectedPost.category}
            </span>

            <h1>{selectedPost.title}</h1>

            <p className="reader-excerpt">{selectedPost.excerpt}</p>

            <p className="post-author">
              Written by {getAuthorName(selectedPost)}
            </p>

            <div className="reader-content">
              {selectedPost.content}
            </div>

            {isPostOwner(selectedPost) && (
                <div className="reader-actions">
                  <button onClick={() => openEditEditor(selectedPost)}>
                    Edit story
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(selectedPost._id)}
                  >
                    Delete story
                  </button>
                </div>
              )}
          </article>
        ) : (
          <>
            <section className="hero">
              <p className="eyebrow">A HOME FOR YOUR THOUGHTS</p>
              <h1>
                Where every story
                <br />
                finds its <em>space.</em>
              </h1>
              <p>
                Discover ideas, share experiences, and give your
                thoughts a place to live.
              </p>

              <button className="primary-button" onClick={openCreateEditor}>
                Start writing →
              </button>
            </section>

            <section className="stories-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE INKSPACE JOURNAL</p>
                  <h2>Explore stories</h2>
                </div>
                <span>{filteredPosts.length} stories</span>
              </div>

              <input
                className="search-input"
                type="text"
                placeholder="Search stories..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div className="category-list">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={category === item ? "active-category" : ""}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="empty-message">Loading stories...</p>
              ) : filteredPosts.length === 0 ? (
                <div className="empty-state">
                  <h3>No stories found.</h3>
                  <p>
                    Be the first to share something interesting with
                    the InkSpace community.
                  </p>
                  <button
                    className="primary-button"
                    onClick={openCreateEditor}
                  >
                    Write the first story
                  </button>
                </div>
              ) : (
                <div className="posts-grid">
                  {filteredPosts.map((post) => (
                    <article
                      className="post-card"
                      key={post._id}
                      onClick={() => setSelectedPost(post)}
                    >
                      <span className="post-category">
                        {post.category}
                      </span>

                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>

                      <div className="post-card-footer">
                        <span>{getAuthorName(post)}</span>
                        <span>Read story →</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <h2>InkSpace<span>.</span></h2>
        <p>Where every story finds its space.</p>
        <p>© {new Date().getFullYear()} InkSpace. All rights reserved.</p>
      </footer>

      {/* Login and registration modal */}
      {authMode && (
        <div
          className="modal-overlay"
          onClick={() => setAuthMode("")}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setAuthMode("")}
            >
              ×
            </button>

            <p className="eyebrow">WELCOME TO INKSPACE</p>
            <h2>
              {authMode === "register"
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <form onSubmit={handleAuth}>
              {authMode === "register" && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm({
                      ...authForm,
                      name: event.target.value,
                    })
                  }
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({
                    ...authForm,
                    email: event.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({
                    ...authForm,
                    password: event.target.value,
                  })
                }
                required
              />

              <button className="primary-button" type="submit">
                {authMode === "register" ? "Create account" : "Log in"}
              </button>
            </form>

            <p className="switch-auth">
              {authMode === "register"
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                onClick={() =>
                  setAuthMode(
                    authMode === "register" ? "login" : "register"
                  )
                }
              >
                {authMode === "register" ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Create and edit blog modal */}
      {showEditor && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditor(false)}
        >
          <div
            className="modal editor-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setShowEditor(false)}
            >
              ×
            </button>

            <p className="eyebrow">YOUR NEXT STORY STARTS HERE</p>
            <h2>{editingPost ? "Edit your story" : "Write a story"}</h2>

            <form onSubmit={handlePostSubmit}>
              <input
                type="text"
                placeholder="Blog title"
                value={postForm.title}
                onChange={(event) =>
                  setPostForm({
                    ...postForm,
                    title: event.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="A short description of your blog"
                value={postForm.excerpt}
                onChange={(event) =>
                  setPostForm({
                    ...postForm,
                    excerpt: event.target.value,
                  })
                }
                required
              />

              <select
                value={postForm.category}
                onChange={(event) =>
                  setPostForm({
                    ...postForm,
                    category: event.target.value,
                  })
                }
              >
                {categories
                  .filter((item) => item !== "All")
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>

              <textarea
                placeholder="Start writing your story..."
                rows="9"
                value={postForm.content}
                onChange={(event) =>
                  setPostForm({
                    ...postForm,
                    content: event.target.value,
                  })
                }
                required
              />

              <button className="primary-button" type="submit">
                {editingPost ? "Save changes" : "Publish story"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;