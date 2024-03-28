const adminRoute = require('./routes/adminRoute');
const userRoute = require('./routes/userRoute');
const path = require('path');
const express = require('express');
const nocache = require('nocache');
const session = require('express-session');
// const MongoDBStore = require('connect-mongodb-session')(session);
const { connectdb, secretKey } = require('./config/config');
require('dotenv').config();
const { err404, err500 } = require('./middleware/errorHandler');

const app = express();
connectdb();

// const store = new MongoDBStore({
//     uri: process.env.mongodb_uri,
//     collection: 'sessions' // Collection name to store sessions in MongoDB
// });

// store.on('error', function(error) {
//     console.log(error);
// });

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    // store: store, // Use MongoDB session store
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/admin', adminRoute);
app.use('/', userRoute);

app.set('views', './views/errors');
app.use(err404);
app.use(err500);

app.get('/admin/dashboard', (req, res) => {
    res.render('admin/dashboard', { page: 'Dashboard' });
});

app.listen(port, console.log(`Server is running on http://localhost:${port}`));
