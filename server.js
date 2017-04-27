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
      res.status(500).json({
        error: 'Internal server error'
      });
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
      res.status(500).json({
        ERROR: 'INTERNAL SERVER ERROR'
      });
    });
});

app.post('/posts', (req, res) => {
  const reqFields = ['title', 'content', 'author'];
  reqFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing ${field} in the request body.`;
      console.error(message);
      return res.status(400).send(message);
    }
  });

  BlogPost
    .create({
      title: req.body.title,
      content: req.body.content,
      author: {
        firstName: req.body.author.firstName,
        lastName: req.body.author.lastName
      }
    })
    .then(blogPost => res.status(201).json(blogPost.apiRepresentation()))
    .catch(err => {
      console.error(err);
      res.status(500).json({
        ERROR: 'INTERNAL SERVER ERROR. SEEK HELP'
      });
    });
});

// delete post by id request params
app.delete('/posts/:id', (req, res) => {
  BlogPost
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(() => {
      let message = `Successfully deleted blog with post id of ${req.params.id}.`
      console.log(message);
      res.json({message: message});
      res.status(204).end();
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        ERROR: 'INTERNAL SERVER ERROR. CALL 911'
      });
    });
});

// update post by id request parameter
app.put('/posts/:id', (req, res) => {
  if (!(req.params.id && req.body.id === req.body.id)) {
    res.status(400).json({
      ERROR: `Request path id and request body id values must match`
    });
  }

  const updated = {};
  const updatableFields = ['title', 'content', 'author'];

  updatableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  BlogPost
    .findByIdAndUpdate(req.params.id, {
      $set: updated
    }, {
      new: true
    })
    .exec()
    .then(updatedPost => res.status(201).json(updatedPost.apiRepresentation()))
    .catch(err => {
      res.status(500).json({
        ERROR: 'INTERNAL SERVER ERROR. IT BLEW UP'
      })
    });
})


// CATCH ALL ROUTE
app.use('*', function (req, res) {
  res.status(404).json({
    message: 'Not Found'
  });
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


if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = { runServer, closeServer, app };