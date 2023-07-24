
const express = require("express");
// Load environment variables. Make sure you fill the .env file
require("dotenv").config();
const app = express();
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');

app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: ['key1']
}));

const pipedrive = require("pipedrive");
const {raw} = require("express");
const apiClient = new pipedrive.ApiClient();

app.use(express.json());


app.use('/', express.static("public"));


async function addNewCustomDealField(name, type)  {
    try {
        console.log('Sending request...');

        const api = new pipedrive.DealFieldsApi(apiClient);

        const response = await api.addDealField({
            name: name,
            field_type: type,
        });

        console.log('Custom field was added successfully!', response);
        return response;
    } catch (err) {
        const errorToLog = err.context?.body || err;

        console.log('Adding failed', errorToLog);
        return errorToLog;
    }
}
app.get("/", function (req, res) {
    console.log('Query----------', req.query);
    console.log('Body-----------', req.body);
    res.sendFile(__dirname + "/public/index.html");
});



app.post("/", async function (req, res) {
    // Get the form data from req.body
    const formData = req.body;
    // Validate the form data
    const errors = validateForm(formData);
    let arr = {};

    if (errors.length > 0) {
        // If there are validation errors, return them to the client
        return res.status(400).json({errors});
    } else {
        // If the form data is valid, process it and perform further actions
        // For example, you can save the data to a database or send it to an external API

        try {
            const axios = require('axios');
            console.log('Sending request...');

            const api = new pipedrive.DealFieldsApi(apiClient);

            // Iterate over the formData and add each field as a DealField
            for (const [name, value] of Object.entries(formData)) {


                const response = await axios.post('https://ikromcompany-sandbox.pipedrive.com/api/v1/dealFields?api_token=' + process.env.PIPEDRIVE_API_KEY, {
                    name: name,
                    field_type: 'text'
                });

                // I would like to use update the fileds value with this fild's id
                // arr[response.data.data.id] = response.data.data.name;
            }
            console.log('Request sent successfully');
            res.redirect('https://www.pipedrive.com/');
        } catch (err) {
            const errorToLog = err.context?.body || err;

            console.log('Adding failed', errorToLog);
        }
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
            token = await apiClient.authorize(req.query.code);
            req.session.accessToken = token.accessToken;
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
    if (!formData.zipCode) {
        errors.push("Zip Code is required");
    }

    // Scheduled
    if (!formData.startDate) {
        errors.push("Start Date is required");
    }

    return errors;
}
