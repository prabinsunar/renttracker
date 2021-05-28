const Tenant = require('../models/tenants');
const Apartment = require('../models/apartments');
const async = require('async');
const { body, validationResult } = require('express-validator');
const { DateTime } = require('luxon');

//callback functions for tenants resource
exports.tenants_get = (req, res, next) => {
	async.parallel(
		{
			tenants: callback => {
				Tenant.find().populate('apartment_occupied').exec(callback);
			},
			apartments: callback => {
				Apartment.find().populate('house').exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}

			res.render('tenant_list', {
				title: 'List of tenants',
				tenant_list: results.tenants,
				apartments: results.apartments,
			});
		}
	);
};

exports.tenant_get = (req, res) => {
	async.parallel(
		{
			tenant: callback => {
				Tenant.findById(req.params.id)
					.populate('apartment_occupied')
					.exec(callback);
			},
			apartments: callback => {
				Apartment.find().populate('house').exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}

			res.render('tenant_detail', {
				title: 'Tenant details',
				tenant: results.tenant,
				apartments: results.apartments,
			});
		}
	);
};

exports.tenant_create_get = (req, res, next) => {
	Apartment.find()
		.populate('house')
		.exec((err, apartments) => {
			if (err) {
				return next(err);
			}

			res.render('tenant_form', {
				title: 'Create new tenant',
				apartment_list: apartments,
				date: DateTime.fromJSDate(new Date(Date.now())).toISODate(),
				tenant: false,
				errors: false,
			});
		});
};

exports.tenant_create_post = [
	body('name').trim().isLength({ min: 1 }).escape(),
	body('phone').isMobilePhone().withMessage('Phone number is not valid'),
	body('email').isEmail().withMessage('Email is not valid'),
	body('movedin_date').isDate().withMessage('Date entered is not valid'),
	body('occupied_apartment').escape(),
	(req, res, next) => {
		const errors = validationResult(req);

		let { name, phone, email, movedin_date, apartment_occupied } = req.body;

		let tenant = new Tenant({
			name,
			phone,
			email,
			movedin_date,
			date_of_occupancy: movedin_date,
			apartment_occupied,
		});

		if (!errors.isEmpty()) {
			Apartment.find()
				.populate('house')
				.exec((err, apartments) => {
					if (err) {
						return next(err);
					}

					res.render('tenant_form', {
						title: 'Create new tenant',
						apartment_list: apartments,
						tenant,
						errors: errors.array(),
					});
				});

			return;
		} else {
			async.parallel(
				{
					tenant: callback => {
						tenant.save(callback);
					},
					apartment: callback => {
						Apartment.findByIdAndUpdate(apartment_occupied, {
							status: 'Occupied',
						}).exec(callback);
					},
				},
				err => {
					if (err) {
						return next(err);
					}

					res.redirect('/tenants');
				}
			);
		}
	},
];

exports.tenant_update_get = (req, res, next) => {
	async.parallel(
		{
			tenant: callback => {
				Tenant.findById(req.params.id)
					.populate('apartment_occupied')
					.exec(callback);
			},
			apartment_list: callback => {
				Apartment.find().populate('house').exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}

			res.render('tenant_form', {
				title: 'Update tenant info',
				tenant: results.tenant,
				apartment_list: results.apartment_list,
				errors: false,
			});
		}
	);
};

exports.tenant_update_post = [
	body('name').trim().isLength({ min: 1 }).escape(),
	body('phone').isMobilePhone().withMessage('Phone number is not valid'),
	body('email').isEmail().withMessage('Email is not valid'),
	body('movedin_date').isDate().withMessage('Date entered is not valid'),
	body('occupied_apartment').escape(),
	(req, res, next) => {
		const errors = validationResult(req);

		let { name, phone, email, movedin_date, apartment_occupied } = req.body;

		let tenant = new Tenant({
			name,
			phone,
			email,
			movedin_date,
			date_of_occupancy: movedin_date,
			apartment_occupied,
			_id: req.params.id,
		});

		if (!errors.isEmpty()) {
			async.parallel(
				{
					tenant: callback => {
						Tenant.findById(req.params.id)
							.populate('apartment_occupied')
							.exec(callback);
					},
					apartment_list: callback => {
						Apartment.find().populate('house').exec(callback);
					},
				},
				(err, results) => {
					if (err) {
						return next(err);
					}

					res.render('tenant_form', {
						title: 'Update tenant info',
						tenant: results.tenant,
						apartment_list: results.apartment_list,
						errors: errors.array(),
					});
				}
			);

			return;
		} else {
			Tenant.findByIdAndUpdate(req.params.id, tenant, {}, (err, thetenant) => {
				if (err) {
					return next(err);
				}

				res.redirect(thetenant.url);
			});
		}
	},
];

exports.tenant_delete_get = (req, res, next) => {
	async.parallel(
		{
			tenant: callback => {
				Tenant.findById(req.params.id)
					.populate('apartment_occupied')
					.exec(callback);
			},
			apartments: callback => {
				Apartment.find().populate('house').exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}

			res.render('tenant_delete', {
				title: 'Remove tenant',
				tenant: results.tenant,
				apartments: results.apartments,
			});
		}
	);
};

exports.tenant_delete_post = (req, res, next) => {
	async.parallel(
		{
			tenant: callback => {
				Tenant.findByIdAndRemove(req.body.tenantid).exec(callback);
			},
			apartment_id: callback => {
				Apartment.findByIdAndUpdate(req.body.apartmentid, {
					status: 'Vacant',
				}).exec(callback);
			},
		},
		err => {
			if (err) {
				return next(err);
			}

			res.redirect('/tenants');
		}
	);
};
