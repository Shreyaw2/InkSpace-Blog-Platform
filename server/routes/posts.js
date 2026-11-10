
import { Router } from "express";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = Router();

const categories = [
  "Technology",
  "Programming",
  "Lifestyle",
  "Career",
  "Other"
];

// GET ALL BLOGS + SEARCH + CATEGORY FILTER
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;

    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } }
      ];
    }

    const posts = await Post.find(filter)
      .populate("author", "name")
      .sort({ createdAt: -1 });

    res.json({ posts });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE BLOG
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name");

    if (!post) {
      return res.status(404).json({
        message: "Blog not found."
      });
    }

    res.json({ post });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE BLOG
router.post("/", auth, async (req, res) => {
  try {
    const { title, excerpt, content, category } = req.body;

    if (
      !title?.trim() ||
      !excerpt?.trim() ||
      !content?.trim() ||
      !categories.includes(category)
    ) {
      return res.status(400).json({
        message: "Please complete all fields."
      });
    }

    const post = await Post.create({
      title,
      excerpt,
      content,
      category,
      author: req.user.id
    });

    await post.populate("author", "name");

    res.status(201).json({ post });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE BLOG
router.put("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Blog not found."
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You cannot edit someone else's blog."
      });
    }

    const { title, excerpt, content, category } = req.body;

    if (
      !title?.trim() ||
      !excerpt?.trim() ||
      !content?.trim() ||
      !categories.includes(category)
    ) {
      return res.status(400).json({
        message: "Please complete all fields."
      });
    }

    post.title = title;
    post.excerpt = excerpt;
    post.content = content;
    post.category = category;

    await post.save();
    await post.populate("author", "name");

    res.json({ post });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE BLOG
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Blog not found."
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You cannot delete someone else's blog."
      });
    }

    await post.deleteOne();

    res.json({
      message: "Blog deleted successfully."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
