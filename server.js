const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
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

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    // required is called validator
    required: [true, 'A tour must have a name'],
    // unique throws an error if a tour is added that has the same name as an existing tour
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
});
// Convention to put model variable with capital letter
const Tour = mongoose.model('Tour', tourSchema);

// Creating document after the model, comparable to ES6 classes
const testTour = new Tour({
  name: 'The Park Camper',
  price: 997,
});
// Saving to the database
testTour
  .save()
  .then((doc) => {
    console.log(doc);
  })
  .catch((err) => {
    console.log('ERROR', err);
  });

const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Listening on port ' + port));
