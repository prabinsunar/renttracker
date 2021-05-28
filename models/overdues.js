//Model for storing rents that are to be paid or not paid.
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const OverDueSchema = new Schema({
	over_dues: { type: Schema.Types.ObjectId, ref: 'Apartment' },
	extended_date: { type: Date, required: true },
});

OverDueSchema.virtual('url').get(function () {
	return `${this._id}`;
});

module.exports = mongoose.model('OverDue', OverDueSchema);
