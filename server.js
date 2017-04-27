const express = require('express');
const bodyParse = require('body-parser');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config.js');
const { BlogPost } = require('./models');

const app = express();
app.use(bodyParser.json());

// init