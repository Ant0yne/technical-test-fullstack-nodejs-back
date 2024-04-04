"use strict";

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET,
});

// Image buffer to base 64 for Cloudinary
const convertToBase64 = (file) => {
	return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
// The path to move the image for this project on Cloudinary
const avatarFolderRootPath = "Marvel/avatar";

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
				message: "Missing valid parameters",
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

		// Check if there is an avatar picture
		// If there is create it, move it to the right path in Cloudinary then add it to the user object in DDN
		if (req.files) {
			console.log("1");
			const uploadedAvatar = await cloudinary.uploader.upload(
				convertToBase64(req.files.avatar)
			);

			// Create the new image path and name
			const newFilePublicId = `${avatarFolderRootPath}/${newUser._id}/${uploadedAvatar.public_id}`;

			// Create the folder if it doesn't exist
			await cloudinary.api.create_folder(
				`${avatarFolderRootPath}/${newUser._id}`
			);

			// Move and rename the file
			const avatarFiled = await cloudinary.uploader.rename(
				uploadedAvatar.public_id,
				newFilePublicId
			);
			newUser.account.avatar = avatarFiled;
		} else {
			console.log("2");
			const uploadedAvatar = await cloudinary.uploader.upload(
				"https://res.cloudinary.com/dxyptix0d/image/upload/v1712224459/marvel/avatar/lhavkiiyduukzinoh5o4.png"
			);

			// Create the new image path and name
			const newFilePublicId = `${avatarFolderRootPath}/${newUser._id}/${uploadedAvatar.public_id}`;

			// Create the folder if it doesn't exist
			await cloudinary.api.create_folder(
				`${avatarFolderRootPath}/${newUser._id}`
			);

			// Move and rename the file
			const avatarFiled = await cloudinary.uploader.rename(
				uploadedAvatar.public_id,
				newFilePublicId
			);
			newUser.account.avatar = avatarFiled;
		}

		await newUser.save();

		return res.status(201).json({
			message: `Your Marvel account was successfully created ${username}. You can now use your email ${email} to login.`,
			token: newUser.token,
			id: newUser._id,
			favComics: newUser.favComics,
			favCharacters: newUser.favCharacters,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

// Retreive favorites Comics and Characters ---------------------------------------------------------------------------------------------------------
router.get("/user/fav", isAuthenticated, fileUpload(), async (req, res) => {
	try {
		return res.status(200).json({
			favComics: req.user.favComics,
			favCharacters: req.user.favCharacters,
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
				message: "Missing valid parameters",
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

// modify the favorites Comics or Characters ---------------------------------------------------------------------------------------------------------
router.put("/user/fav", fileUpload(), async (req, res) => {
	try {
		// The body parameters
		const { favComics, favCharacters, token } = req.body;

		// Search for user with same token in DDB
		const userFound = await User.findOne({
			token: token,
		});

		// If there is none -> error
		if (userFound === null) {
			return res.status(401).json({ error: "Unauthorized to do this action." });
		}

		//Conditions of errors
		//At leat one favorite list and type Array
		if (
			(!favComics && !favCharacters) ||
			(favComics && !Array.isArray(favComics)) ||
			(favCharacters && !Array.isArray(favCharacters))
		) {
			return res.status(400).json({
				message: "No valid favorite list",
			});
		}

		if (favComics) {
			// Replace the fav comics with the one sent in body
			const temp = [...favComics];
			userFound.favComics = temp;

			await userFound.save();

			return res.status(200).json(userFound.favComics);
		} else if (favCharacters) {
			// Replace the fav characters with the one sent in body

			const temp = [...favCharacters];
			userFound.favCharacters = temp;

			await userFound.save();

			return res.status(200).json(userFound.favCharacters);
		} else {
			return res.status(400).json({ message: "No favorite list to update" });
		}
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

module.exports = router;
