//Model for storing information about tenants
const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const TenantSchema = new Schema({
	name: { type: String, minlength: 1, required: true },
	phone: { type: Number, minlength: 10, required: true },
	email: { type: String },
	movedin_date: {
		type: Date,
		default: Date.now(),
	},
	date_of_occupancy: {
		type: Date,
		default: Date.now(),
	},
	apartment_occupied: {
		type: Schema.Types.ObjectId,
		ref: 'Apartment',
	},
});

TenantSchema.virtual('url').get(function () {
	return `/tenant/${this._id}`;
});

//With rent_due movedin_date is changed every 30 days.
TenantSchema.virtual('rent_due').get(function () {
	let rentStart = this.movedin_date;
	let today = new Date();
	let days = 0;
	let divider = 1000 * 60 * 60 * 24;

	days = Math.floor((today - rentStart) / divider);

	return days;
});

TenantSchema.virtual('formatted_occupancy_date').get(function () {
	return DateTime.fromJSDate(this.date_of_occupancy).toLocaleString(
		DateTime.DATE_MED
	);
});

TenantSchema.virtual('form_occupancy_date').get(function () {
	return DateTime.fromJSDate(this.date_of_occupancy).toISODate();
});

module.exports = mongoose.model('Tenant', TenantSchema);
