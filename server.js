//dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");

//port
const PORT = process.env.PORT || 3000;

const db = process.env.MONGODB_URI || "mongodb://localhost/divemongoose";

mongoose.connect(db, function(error) {

    if(error) {
        throw error;
    }
    else {
        console.log("connected to mongoose");
    }
});

// Require Note and Article js file inside models dir
const Note = require("./models/Note.js");
const Article = require("./models/Article.js");

// Our scraping tools
const request = require("request");
const cheerio = require("cheerio");
mongoose.Promise = Promise;

// Initialize Express
const app = express();

app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Make public a static dir for it not to confuse routes
app.use(express.static("public"));

app.use(bodyParser.text());
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
}));

// Use morgan and body parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

//bodyParser
/*app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));*/
//mongodb://heroku_gr4pth5x:rqgj1rb0ds6995q8rhk8e098bf@ds113063.mlab.com:13063/heroku_gr4pth5x
// Database (divesite)configuration with mongoose



// A GET request to scrape the divebuddy website
app.get("/scrape", function(req, res) {
    // First, we grab the html
    request("http://www.divebuddy.com/divesites_browse.aspx?Region=435", function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        const $ = cheerio.load(html);
        // Now, we grab every h2 within an article tag, and do the following:
        $("#dlDiveSites td").each(function(i, element) {
            //console.log('i', i);
            console.log('element', element.children);

            // Save an empty result object
            const result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(element).children("a").text();
            result.link = $(element).children("a").attr("href");
            result.img = $(element).children("img").attr("src");
            result.location = $(element).children("span").text();

            // Using our Article model, create a new entry
            // This effectively passes the result object to the entry (and the title/ link/ img/ location)
            const entry = new Article(result);

            // Now, save that entry to the db
            entry.save(function(err, doc) {
                // Log any errors
                if (err) {
                    console.log(err);
                }
                // Or log the doc
                else {
                    console.log(doc);
                }
            });

        });
    });
    // Tell the browser that we finished scraping the text
    res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
    // Grab every doc in the Articles array
    Article.find({})
        .populate("note")
        .exec(function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            // Or send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Article.findOne({ "_id": req.params.id })
    // ..and populate all of the notes associated with it
        .populate("note")
        // now, execute our query
        .exec(function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            // Otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note(req.body);

    // And save the new note the db
    newNote.save(function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Otherwise
        else {
            // Use the article id to find and update it's note
            Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
            // Execute the above query
                .exec(function(err, doc) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // Or send the document to the browser
                        res.send(doc);
                    }
                });
        }
    });
});


// Listen on port 3000
app.listen(PORT, function () {
    console.log("App listening on PORT " + PORT);
});

