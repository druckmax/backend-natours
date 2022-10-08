const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

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
    /* Sometimes the built in validators like required, min, max or enum are not enough. But we can build our own custom validators. A validator is actually just a simple function which either returns true or false. In this example we want to check if the priceDiscount is lower than the price itself, and when it is then an error should be omitted.

      First we make use of the validate property which takes a normal function(again because of the this keyword). This function has access to the value that was put in(val). Now we check of the value of the priceDiscount is lower than the price itself. In order to add custom message we create another object, insert the message property and put the function in a property called validator. Inside the message we can make use of mongoose functionality, which is accessing the value with a weird syntax, putting it in curly braces and uppercase {VALUE}.

      It is important to note that the this keyword inside the validator will only point to the current document when we are creating a new document. It will not work on update. There are workarounds for that, but they are very complicated and not worth pursuing. If we want to have such a functionality it is worth looking at some third-party libraries on npm, the most popular one being 'validator'.
   */
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

// MONGOOSE MIDDLEWARE
/* Just like Express, Mongoose also inherits the concept of middleware. There are four types of middleware: document, query, aggregate and model middleware. Just like with Express, we can use Mongoose middleware to execute code between two events. For example, each time a new document is saved to the database, we can run a function after the save command is issued but before the actual sacing of the document, as well as after the actual saving. This is the reason why Mongoose's middleware is also called pre and post hooks. A pre hook is exectued before a certain event and post afterwards.
 */
// DOCUMENT MIDDLEWARE
/* Document Middleware can act on the currently processed document. Just like virtual properties, we define middleware in the schema.

The document middleware can run on validate, save, remove, updateOne, deleteOne, init and create, as create fires save() hooks. It does not run on insertMany, which is done via the model middleware. The most commmon event trigger is 'save'.

In this example we use a pre hook in order to run a function before a document is actually saved to the database. This allows us to act on the data before it is passed on. Here, we use it to create slug for the current document with slugify. Quick reminder: A slug is a part of an URL which consists out of a single or multiple words, often separated by hyphens, which are easy to understand for users and search engines. A slug is basically just a string that we can put in the URL, usually based on something like the name of a document.

We pass in the event-trigger 'save' to the hook, followed by a callback function, which needs to be regular function in order for the this keyword to be set to the current document.
We create a new property called slug on the current document via this.slug, call the slugify method, in which we pass the value we want to create a slug out of. We make use of slugify's options and convert everything to lower case by setting lower to true. Remember that in order for the slug property to show up, we also need to define it in our schema.

Just like Express middleware, Mongoose middleware makes use of the next() function, which is essential to call in order to call the next middleware in the stack.
 */
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
/* The post hook additionally has access to the document object, which in case of 'save' is the document we just saved to our database. Like the name implies, post middleware functions are executed after all the pre middlewre functions finished executing. In the post hook we no longer have the this keyword, but the final document in the doc object.
 */

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
/* Query middleware allows us to run functions befoe or after a certain query is executed.

While post and pre hooks look identical in terms of syntax, the difference of the query middleware and the document middleware lies in the this keyword. When we define the 'find' trigger in the pre hook, the this keyword will now point to the current query object.

In this example we create a pre-find hook, which runs before any find query is executed. A use case for this could be if we wanted to have secret tours, that are only offered internally or are only accessible for a certain group of people. We therefore create a secretTour field in our schema. Now we use the find method in the pre hook and select all the tours where the secretTour field is not equal to true. This way we also select all the documents that do not have the secretTour property. By doing this we basically filter out all the secret tours from the output.
 NOTE: Mongoose actually creates the secretTour field for all the existing documents and sets it to its default, so {secetTour: false} would also work.

A problem that occurs that the 'find' trigger does not work for findOne (also not findById which actually uses findOne). We could simply create another pre hook with findOne, but it is a better practice to use a regular expression in this case. We do this with /^find/, which means it should select all the strings that start with 'find'.
*/
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

/* In the post hook of the query middleware we get access to all the documents that are returned from the query, since this middleware runs after the query has finished its execution.
 */
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(docs);
//   next();
// });

// AGGREGATION MIDDLEWARE
/* In the query middleware we hid the secret tour, but in the aggregation pipeline, this secret tour is still used. In order to prevent this we want to exclude the secret tour from the aggregation. We could do this by exclude all the tours with secretTour field set to true in the $match stage of the aggregation. But if we have multiple aggregations, we would have to exclude it from every one in the respective $match stages. Hence, it is a good idea to exclude the secret tour on the model level like in this example.

In aggreagtion middleware, the this keyword is set to the aggregation object. In this object we have access to the pipeline function, which return the array of stages we passed to the aggregation function. Now, we can simply add a $match stage to the beginning of this pipeline function and filter out all the secret tours.
*/

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// Convention to put model variable with capital letter
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
