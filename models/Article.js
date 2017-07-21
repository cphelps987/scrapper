/**
 * Created by courtneyphelps on 7/19/17.
 */
// Require mongoose
const mongoose = require("mongoose");
// Create Schema class
const Schema = mongoose.Schema;

// Create article schema
const ArticleSchema = new Schema({
    // title is a required string
    title: {
        type: String,
        required: true
    },
    // link is a required string
    link: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    // This only saves one note's ObjectId, ref refers to the Note model
    note: {
        type: Schema.Types.ObjectId,
        ref: "Note"
    }
});

// Create the Article model with the ArticleSchema
const Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;
