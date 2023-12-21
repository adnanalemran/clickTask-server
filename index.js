const express = require("express");
const cors = require("cors");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

//midleware
app.use(cors());
app.use(express.json())

//here is mongoDB code

app.get("/", (req, res) => {
    res.send("Backend Server is running...");
});


app.listen(port, () => {
    console.log(`Simple Crud is Running on port ${port}`);
});
