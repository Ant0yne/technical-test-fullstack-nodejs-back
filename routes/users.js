"use strict";

// PACKAGES
const express = require("express");
const axios = require("axios");
const fileUpload = require("express-fileupload");

// All the user controllers
const {
	modifyFavUser,
	loginUser,
	readFavUser,
	createUser,
} = require("../controllers/user");

// check user's token to authenticate them
const isAuthenticated = require("../middlewares/isAuthenticated");

const router = express.Router();

// Create an user account
router.post("/user/signup", fileUpload(), createUser);

// Login to the website
router.put("/user/login", fileUpload(), loginUser);

// Retreive favorites Comics and Characters
router.get("/user/fav", isAuthenticated, fileUpload(), readFavUser);

// modify the favorites Comics or Characters for the user
router.put("/user/fav", isAuthenticated, fileUpload(), modifyFavUser);

module.exports = router;
