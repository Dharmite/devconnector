const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load input validation
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

// Load profile model
const Profile = require("../../models/Profile");
// Load user model
const User = require("../../models/User");

// @route GET api/profile/test
// @desc Tests profile route
// @access Public

router.get("/test", (req, res) => {
  res.json({ msg: "Profile route works" });
});

// @route GET api/profile/:id --> nao fazemos assim porque nao precisamos de dar o id para receber o profile, pq o token tem um payload com o id lá dentro
// @route GET api/profile/
// @desc Get current users profile
// @access Private

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    // o token vai meter o user no req.user
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for that user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route POST api/profile/:id --> nao fazemos assim porque nao precisamos de dar o id para receber o profile, pq o token tem um payload com o id lá dentro
// @route POST api/profile/
// @desc Create user profile
// @access Private

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // check validation
    if (!isValid) {
      // return any errors with 400 status
      return res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};

    // id
    profileFields.user = req.user.id;

    // handle
    if (req.body.handle) profileFields.handle = req.body.handle;

    // company
    if (req.body.company) profileFields.company = req.body.company;

    // website
    if (req.body.website) profileFields.website = req.body.website;

    // location
    if (req.body.location) profileFields.location = req.body.location;

    // bio
    if (req.body.bio) profileFields.bio = req.body.bio;

    // status
    if (req.body.status) profileFields.status = req.body.status;

    // github user name

    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;

    // skills - split into an array
    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills.split(",");
    }

    // Social
    profileFields.social = {};

    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => res.json(profile));
      } else {
        // Create

        // check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = "That handle already exists";
            res.status(400).json(errors);
          }

          // Save profile

          new Profile(profileFields).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

// @route GET api/profile/handle/:handle
// @desc Get profile by handle
// @access Public

// :handle é basicamente um placeholder, aqui o user mete o que quiser, neste caso o nome do user
// Como é publico nao precisamos do passport middleware
// :handle corrosponde a req.params.handle
router.get("/handle/:handle", (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }

      // já vai com o status 200
      res.json(profile);
    })
    .catch(err => {
      res.status(404).json(err);
    });
});

// @route GET api/profile/user/:user_id
// @desc Get profile by user ID
// @access Public

// ::user_id é basicamente um placeholder, aqui o user mete o que quiser, neste caso o nome do user
// Como é publico nao precisamos do passport middleware
// ::user_id corrosponde a req.params.:user_id
router.get("/user/:user_id", (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }

      // já vai com o status 200
      res.json(profile);
    })
    .catch(err => {
      errors.profile_id = "There is no profile with this user ID";
      res.status(404).json(errors);
    });
});

// @route GET api/profile/all
// @desc Get all user profiles
// @access Public

router.get("/all", (req, res) => {
  const errors = {};
  Profile.find()
    .populate("user", ["name", "avatar"])
    .then(profiles => {
      if (profiles.length === 0) {
        errors.noprofiles = "There are no profiles";
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => {
      errors.profile = "There are no profiles";
      res.status(404).json(errors);
    });
});

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        let newExp = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };

        // Add to exp array
        profile.experience.unshift(newExp);

        profile
          .save()
          .then(profile => res.json(profile))
          .catch(err => res.json(err));
      })
      .catch(err => res.json(err));
  }
);

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        let newEdu = {
          school: req.body.school,
          degree: req.body.degree,
          fieldofstudy: req.body.fieldofstudy,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };

        // Add to exp array
        profile.education.unshift(newEdu);

        profile
          .save()
          .then(profile => res.json(profile))
          .catch(err => res.json(err));
      })
      .catch(err => res.json(err));
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        let found_id = false;
        profile.experience.forEach(exp => {
          if (exp._id == req.params.exp_id) {
            found_id = true;
          }
        });
        if (found_id == false) {
          return res.json({ experience: "Experience not found" });
        }
        // get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.experience.splice(removeIndex, 1);

        // Save
        profile
          .save()
          .then(profile => res.json(profile))
          .catch(err => res.json(err));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        let found_id = false;
        profile.education.forEach(edu => {
          if (edu._id == req.params.edu_id) {
            found_id = true;
          }
        });
        if (found_id == false) {
          return res.json({ education: "Education not found" });
        }
        // get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.education.splice(removeIndex, 1);

        // Save
        profile
          .save()
          .then(profile => res.json(profile))
          .catch(err => res.json(err));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private

// UnhandledPromiseRejectionWarning: Error: Can't set headers after they are sent.

router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndDelete({ user: req.user.id })
      .then(() => {
        User.findOneAndDelete({ _id: req.user.id })
          .then(() => res.json({ success: true }))
          .catch(err => res.json(err));
      })
      .catch(err => res.json(err));
  }
);

module.exports = router;
