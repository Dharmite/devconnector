const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require('passport');

/*

Json web token trata de criar um token que permite aceder routes protegidas
Passport serve para validar esse token e para extrair essa informação

*/

// Load user model
const User = require("../../models/User");

// @route GET api/users/test
// @desc Tests users route
// @access Public

router.get("/test", (req, res) => {
  res.json({ msg: "Users route works" });
});

// @route POST api/users/register
// @desc Register an user
// @access Public

router.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exits" });
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", // Size
        r: "pg", // Rating
        d: "mm" // Default
      });
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route POST api/users/login
// @desc Login user / returning token
// @access Public

router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Find user by email

  User.findOne({ email: email }).then(user => {
    // check for user

    if (!user) {
      return res.status(404).json({ email: "User not found" });
    }

    // check user password
    // User password is plain text but in the db the password is encrypted

    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        //User matched

        const payload = { id: user.id, name: user.name, avatar: user.avatar }; // Create JWT Payload

        // Sign the token
        jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {

          if(err) throw err;

          res.json({

            success: true,
            token: 'Bearer ' + token

          });


        });
      } else {
        return res.status(400).json({ password: "Incorrect password" });
      }
    });
  });
});

module.exports = router;

// @route GET api/users/current
// @desc Return current user
// @access Private

router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {

  
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar

  });

});