"use strict";

// PACKAGES
const express = require("express");

// CONTROLLERS
const {
	ListCharacters,
	detailCharacters,
} = require("../controllers/character");

const router = express.Router();

// Get the 100 first characters from API (alphabetic order by default)
router.get("/characters", ListCharacters);

// Get details for a character by ID
router.get("/character/:characterId", detailCharacters);

module.exports = router;
