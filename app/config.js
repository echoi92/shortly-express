var Bookshelf = require('bookshelf');
var Knex  = require('knex');
var path = require('path');

var db = Bookshelf.initialize({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'shortly',
    charset: 'utf8'
    //filename: path.join(__dirname, '../db/shortlydb.')
  }
});

// var User = db.Model.extend({
//   tableName: 'users'
// });


//define user model;

db.knex = Knex.initialize({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'root',
    password : '',
    database : 'shortly',
    charset  : 'utf8'
  }
});

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('base_url', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('clicks').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('clicks', function (click) {
      click.increments('id').primary();
      click.integer('link_id');
      click.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

/************************************************************/
// Add additional schema definitions below
/************************************************************/


module.exports = db;
