"use strict";

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");

const {
	ListComics,
	characterComics,
	detailComics,
} = require("../controllers/comic");

const router = express.Router();

// Get the 100 first comics from API (alphabetic order by default)
router.get("/comics", ListComics);

// Get a character by ID and all comics related to them
router.get("/comics/:characterId", characterComics);

//Get all informations of specific comic
router.get("/comic/:comicId", detailComics);

module.exports = router;
