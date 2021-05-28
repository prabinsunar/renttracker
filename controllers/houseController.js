const House = require('../models/house');
const Apartment = require('../models/apartments');
const Tenant = require('../models/tenants');
const async = require('async');
const OverDue = require('../models/overdues');
const Meet = require('../models/meets');
const { body, validationResult } = require('express-validator');

exports.payments_get = (req, res, next) => {
	Meet.find((err, meets) => {
		if (err) {
			return next(err);
		}
		res.render('payments', {
			title: 'Payments history:',
			meets,
		});
	});
};

exports.index = (req, res, next) => {
	Tenant.find()
		.populate('apartment_occupied')
		.exec((err, tenants) => {
			if (err) {
				next(err);
			}

			let tracker = null;
			let dues = [];
			let parallel = [];

			if (tenants.length > 0) {
				for (let tenant of tenants) {
					if (tenant.rent_due % 30 === 0 && tenant.rent_due !== 0) {
						let object0 = {
							apartment: tenant.apartment_occupied.unit_no,
							tracker: 0,
						};
						findIn(dues, object0);

						parallel.push(callback => {
							new OverDue({
								over_dues: tenant.apartment_occupied._id,
								extended_date: new Date(),
							}).save(callback);
						});

						parallel.push(callback => {
							Tenant.findByIdAndUpdate(tenant._id, {
								movedin_date: new Date(),
							}).exec(callback);
						});
					} else if (tenant.rent_due > 30) {
						parallel.push(callback => {
							new OverDue({
								over_dues: tenant.apartment_occupied._id,
								extended_date: new Date().setDate(
									new Date().getDate() - tenant.rent_due + 30
								),
							}).save(callback);
						});

						let to_be_added = tenant.rent_due - (tenant.rent_due % 30);
						let modified_date = tenant.movedin_date;

						parallel.push(callback => {
							Tenant.findByIdAndUpdate(tenant._id, {
								movedin_date: modified_date.setDate(
									tenant.movedin_date.getDate() + to_be_added
								),
							}).exec(callback);
						});
					} else if (tenant.rent_due === 29) {
						let object1 = {
							apartment: tenant.apartment_occupied.unit_no,
							tracker: -1,
						};
						findIn(dues, object1);
					}
				}
			}

			async.parallel(parallel, err => {
				if (err) {
					next(err);
				}
				async.parallel(
					{
						tenants: callback => {
							Tenant.find().populate('apartment_occupied').exec(callback);
						},
						apartments: callback => {
							Apartment.find().populate('house').exec(callback);
						},
						overDues: callback => {
							OverDue.find().populate('over_dues').exec(callback);
						},
						meets: callback => {
							Meet.find().exec(callback);
						},
					},
					(err, results) => {
						if (err) {
							return next(err);
						}
						results.overDues.forEach(element => {
							tracker = Math.floor(
								(new Date() - element.extended_date) / (1000 * 60 * 60 * 24)
							);

							let object = { apartment: element.over_dues.unit_no, tracker };
							findIn(dues, object);
						});

						res.render('index', {
							title: 'Homepage',
							apartments: results.apartments,
							overDues: results.overDues,
							meets: results.meets,
							dues,
						});
					}
				);
			});
		});
};

//callback for homepage
exports.index_post = (req, res, next) => {
	async.parallel(
		{
			apartment: callback => {
				Apartment.findById(req.body.overDueid).populate('house').exec(callback);
			},
			tenant: callback => {
				Tenant.find({ apartment_occupied: req.body.overDueid }).exec(callback);
			},
			over_due: callback => {
				OverDue.find({ over_dues: req.body.overDueid }).exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}

			let paidDate = new Meet({
				apartment:
					results.apartment.unit_no + ', ' + results.apartment.house.address,
				tenant_name: results.tenant[0].name,
				tenant_phone: results.tenant[0].phone,
				date_paid: new Date(Date.now()),
			});
			paidDate.save(err => {
				if (err) {
					return next(err);
				}
			});

			OverDue.findByIdAndRemove(results.over_due[0]._id, err => {
				if (err) {
					return next(err);
				}

				res.redirect('/');
			});
		}
	);
};

//callback functions for house resource
exports.houses_get = (req, res, next) => {
	House.find((err, houses) => {
		if (err) {
			return next(err);
		}

		res.render('house_list', { title: 'List of houses', house_list: houses });
	});
};

exports.house_get = (req, res, next) => {
	House.findById(req.params.id).exec((err, house) => {
		if (err) {
			return next(err);
		}

		res.render('house_detail', {
			title: 'House details',
			house,
		});
	});
};

exports.house_create_get = (req, res, next) => {
	res.render('house_form', {
		title: 'Create new house',
		house: false,
		errors: false,
	});
};

exports.house_create_post = [
	body('address').trim().isLength({ min: 1 }).escape(),
	body('total_apartments')
		.isInt({ min: 1 })
		.withMessage("Total apartments can't be less than 1"),
	(req, res, next) => {
		const errors = validationResult(req);

		let house = new House({
			address: req.body.address,
			total_apartments: req.body.total_apartments,
		});

		if (!errors.isEmpty()) {
			res.render('house_form', {
				title: 'Create new house',
				house,
				errors: errors.array(),
			});
			return;
		} else {
			house.save(err => {
				if (err) {
					return next(err);
				}

				res.redirect('/houses');
			});
		}
	},
];

exports.house_update_get = (req, res, next) => {
	House.findById(req.params.id).exec((err, house) => {
		if (err) {
			return next(err);
		}

		res.render('house_form', {
			title: 'Update house info',
			house,
			errors: false,
		});
	});
};

exports.house_update_post = [
	body('address').trim().isLength({ min: 1 }).escape(),
	body('total_apartments')
		.isInt({ min: 1 })
		.withMessage("Total apartments can't be less than 1"),
	(req, res, next) => {
		const errors = validationResult(req);

		let house = new House({
			address: req.body.address,
			total_apartments: req.body.total_apartments,
			_id: req.params.id,
		});

		if (!errors.isEmpty()) {
			House.findById(req.params.id).exec((err, house) => {
				if (err) {
					return next(err);
				}

				res.render('house_form', {
					title: 'Update house info',
					house,
					errors: errors.array(),
				});
			});
			return;
		} else {
			House.findByIdAndUpdate(req.params.id, house, {}, (err, thehouse) => {
				if (err) {
					return next(err);
				}

				res.redirect(thehouse.url);
			});
		}
	},
];

exports.house_delete_get = (req, res, next) => {
	async.parallel(
		{
			house: callback => {
				House.findById(req.params.id).exec(callback);
			},
			apartment_list: callback => {
				Apartment.find({ house: req.params.id })
					.populate('house')
					.exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}

			res.render('house_delete', {
				title: 'Remove house',
				house: results.house,
				apartment_list: results.apartment_list,
			});
		}
	);
};

exports.house_delete_post = (req, res, next) => {
	House.findByIdAndRemove(req.body.houseid, err => {
		if (err) {
			return next(err);
		}

		res.redirect('/houses');
	});
};

function findIn(array, object) {
	let present = false;
	array.forEach(ele => {
		if (ele.apartment === object.apartment && ele.tracker === object.tracker) {
			present = true;
		}
	});
	if (!present) array.push(object);
}
