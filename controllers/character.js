"use strict";

// PACKAGES
const axios = require("axios");
const mongoose = require("mongoose");

// Get the 100 first characters from API (alphabetic order by default) ---------------------------------------------------------------------
const ListCharacters = async (req, res) => {
	try {
		let nameWOSpace = "";
		let url = process.env.URL_API + "/characters" + process.env.MARV_API_KEY;

		// All the potential queries received
		const { name, limit, skip } = req.query;

		// Remove the possible between word to add %20 (better for HTTP query)
		name && (nameWOSpace = name.replace(" ", "%20"));

		// Conditions of errors
		// if wrong type of query
		if (
			(name && typeof name !== "string") ||
			(limit && isNaN(limit)) ||
			(skip && isNaN(skip))
		) {
			return res.status(400).json({
				message: "Please use the right type of query.",
			});
		}

		// create the url to contact API with queries if there is some
		name && (url += "&name=" + nameWOSpace);
		limit && (url += "&limit=" + limit);
		skip && (url += "&skip=" + skip);

		const response = await axios.get(url);

		return res.status(200).json(response.data);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// Get details for a character by ID -----------------------------------------------------------------------
const detailCharacters = async (req, res) => {
	try {
		const characterId = req.params.characterId;

		// Check if the ID format is valid
		if (mongoose.isObjectIdOrHexString(characterId) === false) {
			return res.status(400).json({
				message: "Please use a valid Id.",
			});
		}

		const response = await axios.get(
			process.env.URL_API +
				"/character/" +
				characterId +
				process.env.MARV_API_KEY
		);

		return res.status(200).json(response.data);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

module.exports = { ListCharacters, detailCharacters };
