const pipedrive = require("pipedrive");
const express = require("express");
// Load environment variables. Make sure you fill the .env file
require("dotenv").config();

const app = express();
app.use(express.json());

app.use(express.static("public"));

// Callback endpoint
app.get("/callback", async function (req, res) {
    const apiClient = pipedrive.ApiClient.instance;

    let oauth2 = apiClient.authentications.oauth2;
    oauth2.clientId = process.env.CLIENT_ID;
    oauth2.clientSecret = process.env.CLIENT_SECRET;
    oauth2.redirectUri = `https://${process.env.PROJECT_DOMAIN}.glitch.me/callback`;

    if (req.query.code) {
        try {
            const token = await apiClient.authorize(req.query.code);
            console.log("Successful Auth ✅");
            return res.status(200).redirect("/");
        } catch (error) {
            console.error("Wob, Wob, Wobb 🙁");
            console.error(error);
            return res.status(500).send(error);
        }
    } else {
        return res.status(400);
    }
});

app.listen(3000, function () {
    const d = process.env.PROJECT_DOMAIN;
    console.log(
        `🟢 App is running \nApp Panel URL: https://${d}.glitch.me/\nCallback URL: https://${d}.glitch.me/callback`
    );
});
