const express = require('express');
const path = require('path')
const MethodOverride = require('method-override')
const BodyParser = require('body-parser')
const CookieParser = require('cookie-parser')
const session = require('express-session');
const PORT = 3000;

var app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join('src/static')));
app.use(MethodOverride());
app.use(BodyParser.urlencoded({ extended: false }));
app.use(CookieParser());

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    userID: '',
    typeUser: '',
    nameUser: '',
}));

import home from './routes/home';
import admin from './routes/admin';
import inv from './routes/inv';
import ventas from './routes/ventas';

app.use('/', home)
app.use('/', admin);
app.use('/', inv);
app.use('/', ventas);

app.get('*', function(req, res, next) {
    res.status(404)
    res.render('hola');

});
console.log('Servidor conectado a: http://localhost:' + PORT)
app.listen(PORT);
