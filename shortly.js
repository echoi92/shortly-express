var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');

// var db = require('./app/config'); *******need to change this to use bookshelf
var db = require("sqlite3");
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser('S3CRE7'));
  app.use(express.session());
  app.use(app.router);
  //app.use(express.cookieSession());
});

function restrict(req, res, next) {
  if (req.session.user) {
    console.log('next!');
    next();
  } else {
    console.log('not authenticated!');
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

// app.get('/', function(req, res) {
//   //redirect to index 
//   //UNLESS not authorized;
//   res.render('index');
// });

app.get('/', restrict, function(req, res){
  console.log('passed authentication, next');
  console.log('session:', req.session);
 // res.send('This is the restricted area! Hello ' + req.session.user + 'passed the test!');
  res.render('index');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  new User({'username': username, 'password': password})
    .fetch()
    .then(function(model) {
      if(model===null){
        res.redirect('login');
      }else{
        // res.redirect('index');
        req.session.regenerate(function(){
        req.session.user = username;
        res.redirect('/index');
        });
      }
  });
});



app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  new User({'username': username, 'password': password})
  //check if the username is not in the database
  .save()
  .then(function(model) {
    res.redirect('login');
  });
});





  // INERT INTO QUERY
  // new User({
  // 'username': "chicken",
  // 'password': "legs"
  // })
  // .save();

  // UPDATE QUERY
  // User.set({username: "Joe", password: "ahaha"});
  
  // SELECT QUERY
  // new User({'username': 'Eugene'})
  // .fetch()
  // .then(function(model) {
  //   // outputs 'Slaughterhouse Five'
  //   console.log(model.get('password'));
  // });







app.get('/create', function(req, res) {
  res.render('index');
});

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});



app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }



  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
