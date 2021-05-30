require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const router = require('./routes/index');
const PORT = process.env.PORT || 3000;
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const deleteallMiddleware = require('./db-auto');

const url = process.env.MONGODB_URL;
mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error'));

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
	session({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: true,
	})
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(router);

app.listen(PORT, () => {
	console.log('Server listening at ' + PORT);
});
