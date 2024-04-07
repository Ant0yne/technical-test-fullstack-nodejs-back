require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

// ROUTES
const comicsRoutes = require("./routes/comics");
const charactersRoutes = require("./routes/characters");
const usersRoutes = require("./routes/users");

// init Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET,
});

// A try catch to contact the DDB
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		const app = express();
		app.use(cors());
		app.use(express.json());
		app.use(comicsRoutes);
		app.use(charactersRoutes);
		app.use(usersRoutes);

		app.all("/", (req, res) => {
			res.status(200).json({
				message: "Welcome to the Marvel Technical Test!",
			});
		});

		app.all("*", (req, res) => {
			res.status(404).json({ message: "Page not found" });
		});

		app.listen(process.env.PORT, () => {
			console.log("SERVER ON 🔥🔥🔥");
		});
	})
	.catch((error) => {
		console.error(error.message);
	});
