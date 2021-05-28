const Apartment = require('../models/apartments');
const House = require('../models/house');
const async = require('async');
const Tenant = require('../models/tenants');
const { body, validationResult } = require('express-validator');

//callback function for apartments
exports.apartments_get = (req, res, next) => {
	Apartment.find()
		.populate('house')
		.exec((err, apartments) => {
			if (err) {
				return next(err);
			}

			res.render('apartment_list', {
				title: 'List of units',
				apartment_list: apartments,
			});
		});
};

exports.apartment_get = (req, res, next) => {
	async.parallel(
		{
			tenant: callback => {
				Tenant.find({ apartment_occupied: req.params.id }).exec(callback);
			},
			apartment: callback => {
				Apartment.findById(req.params.id).populate('house').exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}

			res.render('apartment_detail', {
				title: 'Unit details',
				apartment: results.apartment,
				tenant: results.tenant.length > 0 ? results.tenant[0] : false,
			});
		}
	);
};

exports.apartment_create_get = (req, res, next) => {
	House.find((err, houses) => {
		if (err) {
			return next(err);
		}

		res.render('apartment_form', {
			title: 'Create new unit',
			apartment: false,
			house_list: houses,
			errors: false,
		});
	});
};

exports.apartment_create_post = [
	body('unit_no')
		.isInt({ min: 1 })
		.withMessage("Unit no. can't be less than 1"),
	body('status').trim().isLength({ min: 1 }).escape(),
	body('house').escape(),
	(req, res, next) => {
		const errors = validationResult(req);

		let { unit_no, status, house } = req.body;

		let apartment = new Apartment({
			unit_no,
			status,
			house,
		});

		if (!errors.isEmpty()) {
			House.find((err, houses) => {
				if (err) {
					return next(err);
				}

				res.render('apartment_form', {
					title: 'Create new unit',
					apartment,
					house_list: houses,
					errors: errors.array(),
				});
			});
			return;
		} else {
			apartment.save(err => {
				if (err) {
					return next(err);
				}

				res.redirect('/apartments');
			});
		}
	},
];

exports.apartment_update_get = (req, res, next) => {
	async.parallel(
		{
			apartment: callback => {
				Apartment.findById(req.params.id).populate('house').exec(callback);
			},
			house_list: callback => {
				House.find(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}
			res.render('apartment_form', {
				title: 'Update unit info',
				apartment: results.apartment,
				house_list: results.house_list,
				errors: false,
			});
		}
	);
};

exports.apartment_update_post = [
	body('unit_no')
		.isInt({ min: 1 })
		.withMessage("Unit no. can't be less than 1"),
	body('status').trim().isLength({ min: 1 }).escape(),
	body('house').escape(),
	(req, res, next) => {
		const errors = validationResult(req);

		let { unit_no, status, house } = req.body;

		let apartment = new Apartment({
			unit_no,
			status,
			house,
			_id: req.params.id,
		});

		if (!errors.isEmpty()) {
			async.parallel(
				{
					apartment: callback => {
						Apartment.findById(req.params.id).populate('house').exec(callback);
					},
					house_list: callback => {
						House.find(callback);
					},
				},
				(err, results) => {
					if (err) {
						return next(err);
					}
					res.render('apartment_form', {
						title: 'Update unit info',
						apartment: results.apartment,
						house_list: results.house_list,
						errors: errors.array(),
					});
				}
			);
			return;
		} else {
			Apartment.findByIdAndUpdate(
				req.params.id,
				apartment,
				{},
				(err, theapartment) => {
					if (err) {
						return next(err);
					}

					res.redirect(theapartment.url);
				}
			);
		}
	},
];

exports.apartment_delete_get = (req, res, next) => {
	async.parallel(
		{
			apartment: callback => {
				Apartment.findById(req.params.id).populate('house').exec(callback);
			},
			tenants: callback => {
				Tenant.find({ apartment_occupied: req.params.id }).exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}
			res.render('apartment_delete', {
				title: 'Remove unit',
				apartment: results.apartment,
				tenant_list: results.tenants,
			});
		}
	);
};

exports.apartment_delete_post = (req, res, next) => {
	Apartment.findByIdAndRemove(req.body.apartmentid, err => {
		if (err) {
			return next(err);
		}

		res.redirect('/apartments');
	});
};
