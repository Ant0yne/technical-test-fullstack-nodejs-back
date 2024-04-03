"use strict";

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//MODELS
const User = require("../models/User");

// check user's token to authenticate them
const isAuthenticated = require("../middlewares/isAuthenticated");

const router = express.Router();

// Create an user account -----------------------------------------------------------------------------------------------------------
router.post("/user/signup", fileUpload(), async (req, res) => {
	try {
		// The body parameters
		const { username, email, password } = req.body;

		console.log(typeof username);

		// Search an user with same mail in DDB
		const userFound = await User.findOne({ email: email });

		// Conditions of errors
		// Body missing or wrong type
		if (
			!username ||
			!email ||
			!password ||
			typeof username !== "string" ||
			typeof email !== "string" ||
			typeof password !== "string"
		) {
			return res.status(400).json({
				message: "Missing parameters",
			});
			// not an email format
		} else if (
			email.trim().split(/[@.]/).length < 3 ||
			email.indexOf(".") === email.length - 1
		) {
			return res.status(400).json({
				message: "Please use a valid email address.",
			});
			// if there already is an account with this email
		} else if (userFound !== null) {
			return res.status(409).json({
				message: "This email already has an account",
			});
		}

		// all the variables to encrypt the user's password
		const saltGenerate = uid2(16);
		const hashGenerate = SHA256(password + saltGenerate).toString(encBase64);
		const tokenGenerate = uid2(64);

		// Create the user
		const newUser = new User({
			account: { username: username },
			email: email,
			salt: saltGenerate,
			hash: hashGenerate,
			token: tokenGenerate,
		});

		await newUser.save();

		return res.status(201).json({
			message: `Your Marvel account was successfully created ${username}. You can now use your email ${email} to login.`,
			token: newUser.token,
			id: newUser._id,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

// Login to the website ---------------------------------------------------------------------------------------------------------
router.put("/user/login", fileUpload(), async (req, res) => {
	try {
		// The body parameters
		const { email, password } = req.body;

		// Search an user with same mail in DDB
		const userFound = await User.findOne({ email: email });

		// Conditions of errors
		// Body missing or wrong type
		if (
			!email ||
			!password ||
			typeof email !== "string" ||
			typeof password !== "string"
		) {
			return res.status(400).json({
				message: "User not found",
			});
			// User not found in DDB
		} else if (userFound === null) {
			return res.status(400).json({
				message: "User not found",
			});
		}

		// all the variables to encrypt the user's typed password
		const saltUser = userFound.salt;
		const hashUser = userFound.hash;
		const hashToTest = SHA256(password + saltUser).toString(encBase64);

		// Check is the user's typed password is the same as the one found in DDB for this email
		if (hashToTest === hashUser) {
			// Send the token for cookie
			const result = {
				token: userFound.token,
				account: { username: userFound.account.username },
				id: userFound._id,
				favCharacters: userFound.favCharacters,
				favComics: userFound.favComics,
			};

			return res.status(200).json(result);
		} else {
			return res.status(400).json({ message: "Wrong password." });
		}
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

// Add a comic/character to fav ---------------------------------------------------------------------------------------------------------
router.put("/user/fav", isAuthenticated, fileUpload(), async (req, res) => {
	try {
		// The body parameters
		const { comicFav, characterFav } = req.body;

		// Conditions of errors
		// At leat one favorite list and type Array
		if (
			(!comicFav && !characterFav) ||
			(comicFav && !Array.isArray(comicFav)) ||
			(characterFav && !Array.isArray(characterFav))
		) {
			return res.status(400).json({
				message: "No valid favorite list",
			});
		}

		if (comicFav) {
			const temp = [...comicFav];
			req.user.favComics = temp;

			await req.user.save();

			return res.status(200).json(req.user.favComics);
		} else if (characterFav) {
			const temp = [...characterFav];
			req.user.favCharacters = temp;

			await req.user.save();

			return res.status(200).json(req.user.favCharacters);
		} else {
			return res.status(400).json({ message: "No favorite list to update" });
		}
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

module.exports = router;
