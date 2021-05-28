//Model for storing data about houses.
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const HouseSchema = new Schema({
	address: { type: String, required: true },
	total_apartments: { type: Number, required: true, min: 1, default: 1 },
});

HouseSchema.virtual('url').get(function () {
	return `/house/${this._id}`;
});

module.exports = mongoose.model('House', HouseSchema);
