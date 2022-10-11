const dotenv = require('dotenv');
const mongoose = require('mongoose');

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
app.listen(port, () => console.log('Listening on port ' + port));
