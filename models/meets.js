//Model for storing informations to the payments section when rent is paid.
const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const MeetSchema = new Schema({
	apartment: { type: String, required: true },
	tenant_name: { type: String, required: true },
	tenant_phone: { type: Number, required: true },
	date_paid: { type: Date, default: Date.now() },
});

MeetSchema.virtual('url').get(function () {
	return `${this._id}`;
});

MeetSchema.virtual('formatted_date_paid').get(function () {
	return DateTime.fromJSDate(this.date_paid).toLocaleString(
		DateTime.DATE_MED_WITH_WEEKDAY
	);
});

module.exports = mongoose.model('Meet', MeetSchema);
