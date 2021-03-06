"use strict";

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* A program to compare the structure of two databases and list the differences.                  */
/*                                                                                                */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const Koa = require('koa'); // Koa framework
const body = require('koa-body'); // body parser
const mysql = require('mysql2/promise'); // fast mysql driver
const debug = require('debug')('app'); // small debugging utility
const cors = require('koa2-cors'); // CORS for Koa 2
const jwt = require('jsonwebtoken'); // JSON Web Token implementation
const bunyan = require('bunyan'); // logging
const koaLogger = require('koa-bunyan'); // logging
const views = require('koa-views'); // koa template rendering middleware
const Twig = require('twig'); // twig php html templates
const twig = Twig.twig;
const serve = require('koa-static-server');
// const render = require('koa-views-render');

require('dotenv').config(); // loads environment variables from .env file (if available - eg dev env)

const app = new Koa();

app.env = process.env.ENVIRONMENT;

// MySQL connection pool (set up on app initialization)
// const config = {
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   charset: 'utf8mb4',
// };
// MySQL connection pool (set up on app initialization)
const configCompareDB1 = {
  host: process.env.DB_COMPARE_1_HOST,
  port: process.env.DB_COMPARE_1_PORT || 3306,
  user: process.env.DB_COMPARE_1_USER,
  password: process.env.DB_COMPARE_1_PASSWORD,
  database: process.env.DB_COMPARE_1_DATABASE,
  charset: 'utf8mb4',
};
// MySQL connection pool (set up on app initialization)
const configCompareDB2 = {
  host: process.env.DB_COMPARE_2_HOST,
  port: process.env.DB_COMPARE_2_PORT || 3306,
  user: process.env.DB_COMPARE_2_USER,
  password: process.env.DB_COMPARE_2_PASSWORD,
  database: process.env.DB_COMPARE_2_DATABASE,
  charset: 'utf8mb4',
};

// global.connectionPool = mysql.createPool(config); // put in global to pass to sub-apps
global.connectionPoolCompareDB1 = mysql.createPool(configCompareDB1); // put in global to pass to sub-apps
global.connectionPoolCompareDB2 = mysql.createPool(configCompareDB2); // put in global to pass to sub-apps

/* set up middleware which will be applied to each request - - - - - - - - - - - - - - - - - - -  */

// return response time in X-Response-Time header
app.use(async function responseTime(ctx, next) {
  const t1 = Date.now();
  await next();
  const t2 = Date.now();
  ctx.set('X-Response-Time', Math.ceil(t2 - t1) + 'ms');
});

// HTTP compression
// app.use(compress({}));

// only search-index www subdomain
app.use(async function robots(ctx, next) {
  await next();
  ctx.response.set('X-Robots-Tag', 'noindex, nofollow');
});

// SERVE STATIC FILES
app.use(serve({rootDir: 'public', rootPath: '/public'}));

// parse request body into ctx.request.body
app.use(body());

// body should only ever be JSON so if it is a string then parse it.
app.use(async (ctx, next) => {
  try {
    if (typeof ctx.request.body === 'string') {
      ctx.request.body = JSON.parse(ctx.request.body);
    }
  } catch (e) {
    // if it is not JSON then we just let it go.
  }
  await next();
});

// sometimes useful to be able to track each request...
app.use(async function (ctx, next) {
  debug(ctx.method + ' ' + ctx.url);
  await next();
});


// handle thrown or uncaught exceptions anywhere down the line
app.use(async function handleErrors(ctx, next) {
  try {
    await next();
  } catch (e) {
    ctx.status = e.status || 500;
    switch (ctx.status) {
      case 204: // No Content
        console.log('status', ctx.status);
        break;
      case 401: // Unauthorized
        ctx.set('WWW-Authenticate', 'Bearer');
        // ctx.body = { message: "login error"};
        break;
      case 403: // Forbidden
      case 404: // Not Found
      case 406: // Not Acceptable
      case 409: // Conflict
        ctx.body = {
          message: e.message
        };
        break;
      default:
      case 500: // Internal Server Error (for uncaught or programming errors)
        console.error(ctx.status, e.message);
        ctx.body = {
          message: e.message
        };
        if (app.env !== 'production') ctx.body.stack = e.stack;
        ctx.app.emit('error', e, ctx); // github.com/koajs/koa/wiki/Error-Handling
        break;
    }
  }
});

// app.use(cors());

// set up MySQL connection - App DB
// app.use(async function mysqlConnection(ctx, next) {
//   try {
//     // keep copy of ctx.state.db in global for access from models
//     ctx.state.db = global.db = await global.connectionPool.getConnection();
//     ctx.state.db.connection.config.namedPlaceholders = true;
//     // traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc
//     await ctx.state.db.query('SET SESSION sql_mode = "TRADITIONAL"');

//     await next();

//     ctx.state.db.release();
//   } catch (e) {
//     // note if getConnection() fails we have no this.state.db, but if anything downstream throws,
//     // we need to release the connection
//     if (ctx.state.db) ctx.state.db.release();
//     throw e;
//   }
// });

// set up MySQL connection - CompareDB1
app.use(async function mysqlConnectionCompareDB1(ctx, next) {
  try {
    // keep copy of ctx.state.db in global for access from models
    ctx.state.comparedb1 = global.comparedb1 = await global.connectionPoolCompareDB1.getConnection();
    ctx.state.comparedb1.connection.config.namedPlaceholders = true;
    // traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc
    await ctx.state.comparedb1.query('SET SESSION sql_mode = "TRADITIONAL"');

    await next();

    ctx.state.comparedb1.release();
  } catch (e) {
    // note if getConnection() fails we have no this.state.db, but if anything downstream throws,
    // we need to release the connection
    if (ctx.state.comparedb1) ctx.state.comparedb1.release();
    throw e;
  }
});

// set up MySQL connection - CompareDB2
app.use(async function mysqlConnectionCompareDB2(ctx, next) {
  try {
    // keep copy of ctx.state.db in global for access from models
    ctx.state.comparedb2 = global.comparedb2 = await global.connectionPoolCompareDB2.getConnection();
    ctx.state.comparedb2.connection.config.namedPlaceholders = true;
    // traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc
    await ctx.state.comparedb2.query('SET SESSION sql_mode = "TRADITIONAL"');

    await next();

    ctx.state.comparedb2.release();
  } catch (e) {
    // note if getConnection() fails we have no this.state.db, but if anything downstream throws,
    // we need to release the connection
    if (ctx.state.comparedb2) ctx.state.comparedb2.release();
    throw e;
  }
});

// logging
const access = {
  type: 'rotating-file',
  path: './logs/api-access.log',
  level: 'trace',
  period: '1d',
  count: 4,
};
const error = {
  type: 'rotating-file',
  path: './logs/api-error.log',
  level: 'error',
  period: '1d',
  count: 4,
};
const logger = bunyan.createLogger({
  name: 'api',
  streams: [access, error]
});
app.use(koaLogger(logger, {}));

// ------------ routing

// public (unsecured) modules first
// app.use(async function cleanJSON(ctx, next) {
//   if (!typeof ctx.request.body === 'object') {
//     ctx.request.body = JSON.parse(ctx.request.body);
//   }
//   await next();
// });

// const options = {
//   extensions: [
//     {
//       file: '/Users/darin/Documents/node/comparedbstructure/views/index.twig',
//       func: 'myTwigExtension'
//     }
//   ]
// };

// // Must be used before any router is used
// app.use(views(__dirname + '/views', {
//   map: {
//     html: 'underscore'
//   }
// }));

// app.use(async function (ctx, next) {
//   ctx.state = {
//     session: this.session,
//     title: 'app'
//   };
//   await renderFile('/Users/darin/Documents/node/comparedbstructure/views/index.twig', options, function (error, template) {
//     {
//       message : "Hello World"
//     }
//   });
// });

// renderFile('/Users/darin/Documents/node/comparedbstructure/views/index.twig', options, function (error, template) {
  
// });


// This section is optional and used to configure twig.
// app.set("twig options", {
//   allow_async: true, // Allow asynchronous compiling
//   strict_variables: false
// });


// koa-views-render
// app.use(async function (ctx) {
//   await ctx.render('template.twig')
// });

// SET VIEWS DIRECTORY
app.use(views(__dirname + '/views', { map: {html: 'twig', twig: 'twig' }}));

app.use(require('./routes/routes-root.js'));
app.use(require('./routes/routes-dbcompare.js'));
//app.use(require('./routes/routes-auth.js'));
//app.use(require('./routes/routes-util.js'));

// remaining routes require JWT auth (obtained from /auth and supplied in bearer authorization header)

// app.use(async function verifyJwt(ctx, next) {
//   if (!ctx.header.authorization) ctx.throw(401, 'Authorisation required');
//   const [ scheme, token ] = ctx.header.authorization.split(' ');
//   if (scheme != 'Bearer') ctx.throw(401, 'Invalid authorisation');
//
//   try {
//     const payload = jwt.verify(token, process.env.JWT_KEY); // throws on invalid token
//     // valid token: accept it...
//
//     let sqla = `select status from user where id = ${payload.id}`;
//     const [[res]] = await global.db.query(sqla);
//
//     if (res.status === 0){
//       ctx.body = "Account Disabled"
//       throw({ status: 401, message: 'Account Disabled' });
//     }
//
//     ctx.state.user = payload; // for user id  to look up user details
//   } catch (e) {
//     if (e.message === 'invalid token') ctx.throw(401, 'Invalid JWT'); // Unauthorized
//     ctx.throw(e.status || 401, e.message); // Internal Server Error
//   }
//
//   await next();
//
// });


// app.use(renderFile('./views/template.twig', options, function (error, template) {
//   // ... do something with the rendered template. :)
// }));

/* create server - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

app.listen(process.env.PORT || 3000);
console.info(
  `${process.version} listening on port ${process.env.PORT || 3000} (${app.env}/${/*config.database*/ "database"})
  http://localhost:${process.env.PORT || 3000}`
);

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


module.exports = app;