//Model for storing info about apartments or units.
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ApartmentSchema = new Schema({
	house: { type: Schema.Types.ObjectId, ref: 'House', required: true },
	unit_no: { type: Number, required: true, min: 1 },
	status: { type: String, enum: ['Vacant', 'Occupied'], default: 'Vacant' },
});

ApartmentSchema.virtual('url').get(function () {
	return `/apartment/${this._id}`;
});

ApartmentSchema.virtual('address').get(function () {
	return `${this.unit_no}, ${this.house}`;
});

module.exports = mongoose.model('Apartment', ApartmentSchema);
