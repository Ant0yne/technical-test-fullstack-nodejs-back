require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// ROUTES
const comicsRoutes = require("./routes/comics");
const charactersRoutes = require("./routes/characters");
const usersRoutes = require("./routes/users");

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
				message:
					"Bienvenue sur ce Test Technique Fullstack ! Tout sur Marvel !",
			});
		});

		app.all("*", (req, res) => {
			res.status(404).json({ message: "Page not found" });
		});

		app.listen(process.env.PORT, () => {
			console.log("SERVER ON");
		});
	})
	.catch((error) => {
		console.error(error.message);
	});
