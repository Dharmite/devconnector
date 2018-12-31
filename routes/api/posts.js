const express = require("express");
const router = express.Router();

// Pq estamos a lidar com a db
const mongoose = require("mongoose");

// Passport pq temos routes privadas
const passport = require("passport");

// isEmpty function
// const isEmpty = require('./is-empty');

// Validation
const validatePostInput = require("../../validation/post");

// Load post model
const Post = require("../../models/Post");

// Load profile model
const Profile = require("../../models/Profile");

// @route GET api/posts/test
// @desc Tests post route
// @access Public

router.get("/test", (req, res) => {
  res.json({ msg: "Posts route works" });
});

// @route GET api/posts
// @desc Get posts
// @access Public

router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.send(posts))
    .catch(err => res.status(404).json({ nopostsfound: "no posts found" }));
});

// @route GET api/posts/:post_id
// @desc Get a single post
// @access Public

router.get("/:post_id", (req, res) => {
  Post.findById({ _id: req.params.post_id })
    .then(post => res.send(post))
    .catch(err => res.json({ nopostfound: "no post found with that id" }));
});

// @route POST api/posts
// @desc Create post
// @access Private

//  API servers often require credentials to be supplied with each request.
// When this is the case, session support can be safely disabled by
// setting the session option to false.
// alterar de modo a que so alguem com profile pode fazer um post

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // if(!isEmpty(validatePostInput(req.body))){
    //   return res.status(400).json(errors);
    // }

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    // Não podia ser avatar: req.user.avatar e req.user.name???

    const newPost = {
      text: req.body.text,
      name: req.body.name, // req.user.name
      avatar: req.body.avatar, // req.user.avatar
      user: req.user.id
    };

    new Post(newPost)
      .save()
      .then(post => res.json(post))
      .catch(err => res.json(err));
  }
);

// Nota: Fazer update no futuro

router.delete(
  "/:post_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.post_id)
        .then(post => {
          // Check for post owner

          if (post.user.toString() !== req.user.id) {
            // return para terminar a funcao
            return res
              .status(401)
              .json({ noauthorized: "user not authorized" });
          }

          post
            .remove()
            .then(() => res.json({ success: true }))
            .catch(err => res.json(err));
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

// @route POST api/posts/like/:post_id
// @desc Like a post
// @access Private

router.post(
  "/like/:post_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.post_id)
          .then(post => {
            if (
              post.likes.filter(like => like.user.toString() === req.user.id)
                .length > 0
            ) {
              return res
                .status(400)
                .json({ alreadyliked: "post already liked" });
            }

            post.likes.unshift({ user: req.user.id });
            post
              .save()
              .then(post => res.json(post))
              .catch(err => res.json(err));
          })
          .catch(err => res.json({ postnotfound: "post not found" }));
      })
      .catch(err =>
        res.status(404).json({ profilenotfound: "Profile not found" })
      );
  }
);

// @route POST api/posts/unlike/:post_id
// @desc Unlike a post
// @access Private

router.post(
  "/unlike/:post_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.post_id)
          .then(post => {
            if (
              post.likes.filter(like => like.user.toString() === req.user.id)
                .length === 0
            ) {
              return res
                .status(400)
                .json({ notliked: "You have not liked this post" });
            }

            let index;
            post.likes.forEach(element => {
              if (req.user.id === element.user.toString()) {
                index = post.likes
                  .map(item => item.user.toString())
                  .indexOf(req.user.id);
              }
            });

            post.likes.splice(index, 1);

            post
              .save()
              .then(post => res.json(post))
              .catch(err => res.json(err));
          })
          .catch(err => res.json({ postnotfound: "post not found" }));
      })
      .catch(err =>
        res.status(404).json({ profilenotfound: "Profile not found" })
      );
  }
);

// @route POST api/posts/comment/:post_id
// @desc Add comment
// @access Private

router.post(
  "/comment/:post_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // if(!isEmpty(validatePostInput(req.body))){
    //   return res.status(400).json(errors);
    // }

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.post_id)
          .then(post => {
            const newComment = {
              user: req.user.id,
              text: req.body.text,
              name: req.body.name,
              avatar: req.body.avatar
            };

            post.comments.unshift(newComment);

            post
              .save()
              .then(post => res.json(post))
              .catch(err => res.json(err));
          })
          .catch(err => res.json({ postnotfound: "post not found" }));
      })
      .catch(err =>
        res.status(404).json({ profilenotfound: "Profile not found" })
      );
  }
);

// @route DELETE api/posts/comment/:post_id/:comment_id
// @desc Remove comment from post
// @access Private

router.delete(
  "/comment/:post_id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.post_id)
      .then(post => {
        // Check to see if comment exists
        if (
          post.comments.filter(
            comment =>
              comment._id.toString() === req.params.comment_id &&
              comment.user.toString() === req.user.id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ error: "Can not delete" });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice comment out of array
        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "post not found" }));
  }
);

module.exports = router;
