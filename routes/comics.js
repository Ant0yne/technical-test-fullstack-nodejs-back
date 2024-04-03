"use strict";

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");

const router = express.Router();

// Get the 100 first comics from API (alphabetic order by default) -------------------------------------------------------------------
router.get("/comics", async (req, res) => {
	try {
		let titleWOSpace = "";
		let url = process.env.URL_API + "/comics" + process.env.MARV_API_KEY;

		// All the potential queries received
		const { title, limit, skip } = req.query;

		// Remove the possible between word to add %20 (better for HTTP query)
		title && (titleWOSpace = title.replace(" ", "%20"));

		// Conditions of errors
		// if wrong type of query
		if (
			(title && typeof title !== "string") ||
			(limit && isNaN(limit)) ||
			(skip && isNaN(skip))
		) {
			return res.status(400).json({
				message: "Please use the right type of query.",
			});
		}

		// create the url to contact API with queries if there is some
		title && (url += "&title=" + titleWOSpace);
		limit && (url += "&limit=" + limit);
		skip && (url += "&skip=" + skip);

		const response = await axios.get(url);

		return res.status(200).json(response.data);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

// Get a list of comics containing a specific character -------------------------------------------------------------------
router.get("/comics/:characterId", async (req, res) => {
	try {
		const characId = req.params.characterId;

		if (mongoose.isObjectIdOrHexString(characId) === false) {
			return res.status(400).json({
				message: "Please use a valid Id.",
			});
		}

		const response = await axios.get(
			process.env.URL_API + "/comics/" + characId + process.env.MARV_API_KEY
		);

		return res.status(200).json(response.data);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

//Get all informations of specific comic ----------------------------------------------------------------------------------------
router.get("/comic/:comicId", async (req, res) => {
	try {
		const comicId = req.params.comicId;

		// Check if the ID format is valid
		if (mongoose.isObjectIdOrHexString(comicId) === false) {
			return res.status(400).json({
				message: "Please use a valid Id.",
			});
		}

		const response = await axios.get(
			process.env.URL_API + "/comic/" + comicId + process.env.MARV_API_KEY
		);

		return res.status(200).json(response.data);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

module.exports = router;
