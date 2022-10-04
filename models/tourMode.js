const mongoose = require('mongoose');

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

module.exports = Tour;
