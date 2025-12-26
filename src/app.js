const express = require("express");
const cors = require("cors");
require("dotenv").config();

const slotRoutes = require("./routes/slots");
const bookingRoutes = require("./routes/bookings");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/slots", slotRoutes);
app.use("/bookings", bookingRoutes);

module.exports = app;
