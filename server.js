
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
const apiClient = new pipedrive.ApiClient();
let oauth2 = apiClient.authentications.oauth2;
oauth2.clientId = process.env.CLIENT_ID;
oauth2.clientSecret = process.env.CLIENT_SECRET;
oauth2.redirectUri = `https://${process.env.PROJECT_DOMAIN}.onrender.com/callback`;

let api_key = apiClient.authentications['api_key'];
let refreshToken;

app.use(express.json());


app.use('/', express.static("public"));

app.get("/", function (req, res) {
    console.log('Query----------', req.query);
    console.log('Body-----------', req.body);
    res.sendFile(__dirname + "/public/index.html");
});



app.post("/", function (req, res) {
    // Get the form data from req.body
    oauth2.accessToken = req.session.accessToken;
    oauth2.refreshToken = refreshToken;
    const formData = req.body;
    // Validate the form data
    const errors = validateForm(formData);

    if (errors.length > 0) {
        // If there are validation errors, return them to the client
        return res.status(400).json({ errors });
    } else {
        // If the form data is valid, process it and perform further actions
        // For example, you can save the data to a database or send it to an external API
        let apiInstance = new pipedrive.DealFieldsApi(apiClient);

        let fieldCreateRequest = pipedrive.FieldCreateRequest.constructFromObject({
            name: formData.fieldName, // Field name
            options: formData.options, // Field options if any
            // Add more properties as needed, refer Pipedrive docs for all possible properties
        });

        apiInstance.addDealField(fieldCreateRequest).then((data) => {
            console.log('API called successfully. Returned data: ' + data);
            return res.status(200).json({ message: "Form submitted successfully", data });
        }, (error) => {
            console.error(error);
            // Return an error response to client
            return res.status(500).json({message: "Error occurred while adding deal field"});
        });
    }
});

app.get('/alldeals', async (req, res) => {
    if (req.session.accessToken !== null && req.session.accessToken !== undefined) {
        // token is already set in the session
        // now make API calls as required
        // client will automatically refresh the token when it expires and call the token update callback
        const api = new pipedrive.DealsApi(apiClient);
        const deals = await api.getDeals();

        res.send(deals);
    } else {
        const authUrl = apiClient.buildAuthorizationUrl();

        res.redirect(authUrl);
    }
});

app.get("/callback", async function (req, res) {
    if (req.query.code) {
        try {
            const promise = await apiClient.authorize(req.query.code);
            promise.then(() => {
                req.session.accessToken = apiClient.authentications.oauth2.accessToken;
                return res.redirect('/');
            }, (exception) => {
                // error occurred, exception will be of type src/exceptions/OAuthProviderException
            });
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
