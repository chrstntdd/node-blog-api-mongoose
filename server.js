const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');

const { PORT, DATABASE_URL } = require('./config.js');
const { BlogPost } = require('./models');

const app = express();

app.use(bodyParser.json());
app.use(morgan('common'));

mongoose.Promise = global.Promise;

// Get all posts
app.get('/posts', (req, res) => {
  BlogPost
    .find()
    .exec()
    .then(posts => res.json(posts.map(post => post.apiRepresentation())))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Internal server error'});
    });
});

// Get single posts by id
app.get('/posts/:id', (req, res) => {
  BlogPost
    .findById(req.params.id)
    .exec()
    .then(post => res.json(post.apiRepresentation()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ERROR: 'INTERNAL SERVER ERROR'});
    });
});

// CATCH ALL ROUTE
app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

let server;

let runServer = (databaseUrl = DATABASE_URL, port = PORT) => {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
          console.log(`Your app is listening on port ${port} with databaseurl ${databaseUrl}.`);
          resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

let closeServer = () => {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server. Goodbye old friend.');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}


if (require.main === module){
  runServer().catch(err => console.error(err));
}

module.exports = { runServer, closeServer, app };