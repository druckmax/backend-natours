const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

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

// READ JSON FILE
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  // process.exit() is outside of the try-catch block so that the node process ends if either try was successful or not
  process.exit();
};

// DELETE ALL EXISTING DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

/* We can call the importData and deleteData function from the terminal with

node dev-data/data/import-dev-data.js --import
or
node dev-data/data/import-dev-data.js --delete

 */
