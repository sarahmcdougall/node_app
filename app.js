const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const app = express();

const DB_NAME = 'problemset3-4';
const COLLECTION_NAME = 'places';

app.use(bodyParser.urlencoded({ extended: true }));

// "home" view - HTML form
app.get('/', (req, res) => {
    res.send(`
        <h1>Places/Zip Code Retrieval</h1>
        <p>Enter a place OR zip code to look up in the database.</p>
        <form action="/process" method="post">
            <label for="entry">Enter a place or zip code:</label>
            <input type="text" id="entry" name="placeOrZipCode" required>
            <button type="submit">Submit</button>
        </form>
    `);
});


const isPlace = (str) => {
    const firstChar = parseInt(str.charAt(0));
    return isNaN(parseInt(firstChar));
}

const formatPlace = (str) => {
    if (str && str.length > 1) {
        // capitalize first letter, set the rest to lowercase
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } else {
        // just return string because we know there will be no results anyway
        return str;
    }
}

// "process" view - Read form data and display it
app.post('/process', async (req, res) => {
    // read the data from the form
    const formEntry = req.body.placeOrZipCode.trim();
    console.log('Retrieved data');

    let mongoQuery;
    // decide whether the data is a place or a zip code
    // check the first character
    if (isPlace(formEntry)) {
        // query will be based on places
        mongoQuery = { place: formatPlace(formEntry) };
    } else {
        // query will be based on zip code
        mongoQuery = { zips: formEntry };
    }

    // look up in the database
    try {
        // Connect to MongoDB
        const mongoClient = await MongoClient.connect(process.env.MONGO_URL);
        console.log('Connected to client');
        const db = mongoClient.db(DB_NAME);
        const placesCollection = db.collection(COLLECTION_NAME);
        const result = await placesCollection.findOne(mongoQuery);
        console.log('Retrieved result');

        const returnBtn = '<a href="/" class="btn">Back to Search</a>';
        const header = '<h1>Places/Zip Code Retrieval</h1>';
        if (result) {
            res.send(`${header}<h2>${result.place}</h2><p>Zip Codes: ${result.zips.join(', ')}</p>${returnBtn}`);
        } else {
            res.send(`${header}<p>No matching data found.</p>${returnBtn}`);
        }
        mongoClient.close();
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}!`);
});