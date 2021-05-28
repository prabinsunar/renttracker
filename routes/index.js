const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/users');
const bcrypt = require('bcryptjs');

const houseController = require('../controllers/houseController');
const apartmentController = require('../controllers/apartmentController');
const tenantController = require('../controllers/tenantController');

passport.use(
	new LocalStrategy((username, password, done) => {
		User.findOne({ username }).exec((err, user) => {
			if (err) {
				return done(err);
			}

			if (!user) {
				return done(null, false, { message: 'Incorrect username' });
			}

			bcrypt.compare(password, user.password, (err, res) => {
				if (res) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Incorrect password' });
				}
			});
		});
	})
);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (err, user) => {
		done(err, user);
	});
});

//login-specific routes
router.get('/login', (req, res, next) => {
	res.render('login', {
		title: 'Login page',
		error: req.flash('error'),
	});
});

router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true,
	})
);

function userAuth(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/login');
	}
}

router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/login');
});

//home-page route
router.get('/', userAuth, houseController.index);

router.post('/', houseController.index_post);

router.get('/payments', houseController.payments_get);

//routes for house CRUD operations
router.get('/houses', userAuth, houseController.houses_get);

router.get('/house/create', userAuth, houseController.house_create_get);

router.post('/house/create', houseController.house_create_post);

router.get('/house/:id/update', userAuth, houseController.house_update_get);

router.post('/house/:id/update', houseController.house_update_post);

router.get('/house/:id/delete', userAuth, houseController.house_delete_get);

router.post('/house/:id/delete', houseController.house_delete_post);

router.get('/house/:id', userAuth, houseController.house_get);

//routes for apartement CRUD operations
router.get('/apartments', userAuth, apartmentController.apartments_get);

router.get(
	'/apartment/create',
	userAuth,
	apartmentController.apartment_create_get
);

router.post('/apartment/create', apartmentController.apartment_create_post);

router.get(
	'/apartment/:id/update',
	userAuth,
	apartmentController.apartment_update_get
);

router.post('/apartment/:id/update', apartmentController.apartment_update_post);

router.get(
	'/apartment/:id/delete',
	userAuth,
	apartmentController.apartment_delete_get
);

router.post('/apartment/:id/delete', apartmentController.apartment_delete_post);

router.get('/apartment/:id', userAuth, apartmentController.apartment_get);

//routes for tenant CRUD operations
router.get('/tenants', userAuth, tenantController.tenants_get);

router.get('/tenant/create', userAuth, tenantController.tenant_create_get);

router.post('/tenant/create', tenantController.tenant_create_post);

router.get('/tenant/:id/update', userAuth, tenantController.tenant_update_get);

router.post('/tenant/:id/update', tenantController.tenant_update_post);

router.get('/tenant/:id/delete', userAuth, tenantController.tenant_delete_get);

router.post('/tenant/:id/delete', tenantController.tenant_delete_post);

router.get('/tenant/:id', userAuth, tenantController.tenant_get);

module.exports = router;
