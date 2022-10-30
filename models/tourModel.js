const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required is called validator
      required: [true, 'A tour must have a name'],
      // unique throws an error if a tour is added that has the same name as an existing tour
      // unique is actually not a validator
      unique: true,
      // trim removes all white space in beginning and end of string
      trim: true,
      // min- and maxlength only works for strings
      maxLength: [40, 'A tour name must have less or equal to 40 characters'],
      minLength: [10, 'A tour name must have at 10 least characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // enum is available on all strings; let's us choose from an array of valid options
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // min and max works for numbers and date objects
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot be larger than 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    // CUSTOM VALIDATOR
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount price ({VALUE}) should be below the regular price',
        validator: function (val) {
          return val < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      // Date automatically converted by MongoDB
      default: Date.now(),
      // Excludes createdAt to be sent to the client and makes it only available for internal use
      select: false,
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  // OPTIONS OBJECT OF THE SCHEMA
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// VIRTUAL PROPERTIES
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// MONGOOSE MIDDLEWARES
// DOCUMENT MIDDLEWARE
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// AGGREGATION MIDDLEWARE

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// Convention to put model variable with capital letter
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

// # Modelling locations / Geospatial data

/* In this example we will embed location data into the tour model. MongoDb supports gespatial data out of the box. Geospatial data is data which describes a place's coordinates using latitude and longitude. This helps us to describe simple location points, but also complex geometries like lines or polygons.

When working with geospatial data, mongoDB uss a special data format called GeoJSON. This means that when defining an object, this object no longer refers to the schema's options, but is really just an embedded object. In order for this object to be recoginzed as GeoJSON, we need two properties, namely type and coordinates. Inside this object we can now define our schema options for our fields.

```js
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
  ``?`
 */

// Child Referencing and Populating Data

/* Creating child references is fairly easy. We need to create a field in our schema, in this case it is called 'guides'. We set it to be an array since we expect multiple user objects with the role of 'guide'. As type we define the ObjectId on the mongoose.Schema object. To reference the correct userModel we simply pass the name of the model as a string to the ref field.

In order to show the referenced data in our response, we need to populate this field. Mongooose will then make another query to get the information from the referenced userModel. We have to keep that in mind as it might lower performance when we are populating a lot fields.

In our case we create a convenient query middleware and add the populate method to every method that starts with find and is called on our tourModel. Populate() can simply take the name of the field that needs to be populated, or an options object, in which we can add further options, for example not showing the '__v' or 'passwordChangedAt' fields in our response.

```js
// In the tourSchema
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],

// Query middleware
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
```
 */
