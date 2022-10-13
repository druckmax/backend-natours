const dotenv = require('dotenv');
const mongoose = require('mongoose');

// # Uncaught Exceptions

/* All errors or bugs that occur in our synchronous code but are not handled anywhere are called uncaught exceptions. The procedure is very similar to handling uncaught promise rejections, with the difference that crashing our application is necessary when we have an uncaught exception, because after an uncaught excpetion appears, the application is in a so-called unclean state. The only way to fix this is to terminate the process and restart.

It is important to put this eventListener before any other code is executed, and especially before importing our main application, because we are dealing with synchronous code.

It is common to have a tool in production that will restart the server automatically after crashing. Many hosting services already do this out of the box.
 */

process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION! 💥 Shutting down...');
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './.config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  // When connecting to local database, URL saved in database local
  //.connect(process.env.DATABASE_LOCAL)
  .connect(DB, {
    // Options are needed for deprecation warnings
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful'));

const port = process.env.PORT || 5000;
const server = app.listen(port, () => console.log('Listening on port ' + port));

// # Unhandled Promise Rejections
/* One example where an unhandled promise rejection might occur, if we try to connect to our database with a wrong password. Of course we could account for that error by adding a catch handler to mongoose's connect function. But there is also a way of globally handling unhandled rejected promises. Especially in larger projects it can become quite difficult to keep track of all the promises that might get rejected at some point. 

Each time there is an unhandled rejection in our application the process object will emit an object called unhandled rejection, which we can listen to. In the callback function we can log the message and name for example and also quit the process with process.exit(), if desired. Remember that this is not mandatory for unhandled rejections in contrast to uncaught exceptions, where crahsing the application is necessary. Inside exit(), we can pass in a 1, which stands for uncaught exception, which is mostly used in this context. FYI: The code 0 in the exit function stands for success.

process.exit() can be seen as a very abrupt way of shutting down your application. So often times it is more desireable to shut down gracefully, which means that we close the server first and only then shut down the application. By doing this we give the server time to finish all the requests that are still pending or being handled.
So first we need to save app.listen() to variable called server. Inside the unhandledRejection callback we can now call server.close() and inside we pass in the process.exit(1), which will be executed once the server finished all pending tasks.

This can be seen as the last safety net for rejected promises and it is recommended to account for all accidental promise rejections like this.
 */

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  server.close(() => process.exit(1));
});
