const pipedrive = require("pipedrive");
const express = require("express");
// Load environment variables. Make sure you fill the .env file
require("dotenv").config();

const app = express();
app.use(express.json());

app.use('/', express.static("public"));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/", function (req, res) {
    // Get the form data from req.body
    const formData = req.body;
    // Validate the form data
    const errors = validateForm(formData);

    if (errors.length > 0) {
        // If there are validation errors, return them to the client
        return res.status(400).json({ errors });
    } else {
        // If the form data is valid, process it and perform further actions
        // For example, you can save the data to a database or send it to an external API
        console.log('After validation: ',formData);
        // Return a success response if everything is fine
        return res.status(200).json({ message: "Form submitted successfully" });
    }
});

app.get("/callback", async function (req, res) {
    const apiClient = new pipedrive.ApiClient();

    let oauth2 = apiClient.authentications.oauth2;
    oauth2.clientId = process.env.CLIENT_ID;
    oauth2.clientSecret = process.env.CLIENT_SECRET;
    oauth2.redirectUri = `https://${process.env.PROJECT_DOMAIN}.onrender.com/callback`;

    const authUrl = apiClient.buildAuthorizationUrl();
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
        `🟢 App is running \nApp Panel URL: https://${d}.onrender.com/\nCallback URL: https://${d}.onrender.com/callback`
    );
});

// Function to validate the form data
function validateForm(formData) {
    const errors = [];

    // Client Details
    if (!formData.firstName) {
        errors.push("First Name is required");
    }
    if (!formData.lastName) {
        errors.push("Last Name is required");
    }
    if (!formData.phone) {
        errors.push("Phone is required");
    }
    if (!formData.email) {
        errors.push("Email is required");
    }

    // Job Details
    if (!formData.jobType) {
        errors.push("Job Type is required");
    }
    if (!formData.jobSource) {
        errors.push("Job Source is required");
    }

    // Service Location
    if (!formData.address) {
        errors.push("Address is required");
    }
    if (!formData.city) {
        errors.push("City is required");
    }
    if (!formData.state) {
        errors.push("State is required");
    }
    if (!formData.zipCode) {
        errors.push("Zip Code is required");
    }
    if (!formData.area) {
        errors.push("Area is required");
    }

    // Scheduled
    if (!formData.startDate) {
        errors.push("Start Date is required");
    }
    if (!formData.startTime) {
        errors.push("Start Time is required");
    }
    if (!formData.endTime) {
        errors.push("End Time is required");
    }
    if (!formData.testSelect) {
        errors.push("Test Select is required");
    }

    return errors;
}
