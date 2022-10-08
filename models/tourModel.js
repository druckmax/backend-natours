const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required is called validator
      required: [true, 'A tour must have a name'],
      // unique throws an error if a tour is added that has the same name as an existing tour
      unique: true,
      // trim removes all white space in beginning and end of string
      trim: true,
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
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: Number,
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
  },
  // OPTIONS OBJECT OF THE SCHEMA
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// VIRTUAL PROPERTIES
/* Virtual properties are fields that we can define onour schema that will no be persisted. This means they will not be saved into the database in order to save some space. A use case for this could be a conversion from mph to kph, because we do not need to save an extra field for this information as it can be calculated from an existing one.

In our example we want to retrieve the duration of a tour in weeks, which we can derive from the duration field, which is in days. We call the 'virtual' method on the tourSchema and pass in the name of the new virtual field. Now we append a getter or get method, since the virtual property needs to be created each time that we request some data of the database. In the getter we need to pass in a regular function, because an arrow function does not get its own this keyword. But we need the this keyword in order to point to the duration field of the current document. So the this keyword in this case points to the current document. It is recommendable to simply make it a convention to use regular functions in callbacks when dealing with mongoose in general.

Now we can simply point to the duration field with this.duration and divide it by 7.

In order for the virtual properties to show up in our output, we need to explicity define that in our schema. We do this by adding a second object to the schema function and set virtuals to true, for both the toJSON and toObject fields.

One thing to keep in mind is that we cannot use virutal properties in a query, because technically they are not part of the database. For example this disables Tour.find() regarding this property.

We could have done this conversion each time after we query the data in a controller, but that would not be the best practice, because we want to try to keep business logic and application logic as much separated as possible.
 */

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Convention to put model variable with capital letter
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
