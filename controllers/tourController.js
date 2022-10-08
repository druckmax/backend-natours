const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

// ALIASING
/* Here we create our own custom middleware, which will be used for the /top-5-tours route. This way we can make a custom route, which handels some search results that are often requested or we'd like to offer the client. By using the middleware, we can prefill the query object with some properties, which then will be handled in the getAllTours controller function. So we can call the getAllTours function from our new route, but by putting a the alias middleware before it, we configure the query object to filter our results, even if the user does not pass in any queries by him-/herself. */
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    /* In summary: We are creating a new object out of the APIFeatures class. In there we are passing a queryObject and the queryString that is coming from express. In each of the four methods we chain onto the object, we manipulate the query. By the end we simply await the result, so that it can come back with all the documents that we selected. This query now lives at features, which is the new obejct we created.
     */

    // EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    // Sending JSON back and format it according to Jsend specification
    // Additionally adding results key which holds the length of the tours array as an extra
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    });
  } catch (err) {
    console.error(err);
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: tour,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.createTour = async (req, res) => {
  try {
    /*   const newTour = new Tour({});
  newTour.save(); */
    // is similar to the code below. save and create return both a promise
    const newTour = await Tour.create(req.body);

    // 201 stands for created
    res.status(201).json({
      status: 'success',
      data: { tour: newTour },
    });
  } catch (err) {
    // 400 stands for bad request
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // findByIdAndUpdate to do both tasks in one function
    // Arguments: 1. ID, 2. new data 3. options:
    // Option1: new:true returns modified documents rather than the original one. Default is false
    // Option2: runValidators: runs update validators. update validators validate the update operation aginst the model's schema
    // Updates the fields that are different in the req.body, only works because we are using a PATCH request
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    // 204 stands for no content
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

// AGGREGATION PIPELINE
/*  MongoDB's aggregation pipeline is a powerful tool for data aggregation, which means combining data from multiple sources, processeing the data for new insights and presenting them. Through data aggregation statistics such as average, minimum, maximum, sum and count can be provided. The idea is that we define a pipeline that all documents from a certain collection gothrough and where they a processe step by step in order to transform them into aggregated results.

In order to implement such a pipeline, we create an async function and await the aggregate object coming from the aggregate method, invoked on the 'Tour' model, in order to access our tour collection.

Inside the aggregation method we pass in an array of so-called stages. Every array element will be one of the stages. The documents of the collection then pass thtrough these stages one by one, step by step in the defined sequence of the array. We define a stage by passing object to the array, containing a field prepended by a $-sign. A stage looks and behaves very smiliar to a regular query.

Some very popular stages are $match, which is like a filter in order to select documents, and $group, which helps us grouping documents together using accumulators. We can calculate average values with group, for example. The first thing we need to pass in to the $group stage is an _id, in which we specify what we want to group by. For example, if we pass in the difficulty, $group will group the documents based on their difficulty value. If we want to calculate a value for all the documents and not seperated by groups, we can simply pass null to the _id.

In order to calculate the averageRatings, we define a new field and give a meaningful name. Then inside the field we pass in another object and use the $avg operator, which is a mathematical operator of mongoDB. When using these mathematical operators the values that we take for the operations must be in quotation marks and be prepended by a $-sign ( $avg: '$ratingsAverage' ).

To calculate the sum of all the documents, we use the $sum operator and simply pass in one, so one for every documents that goes through the aggregation pipeline.

If we want to sort our grouped calculations, we can add $sort stage. It is important to note that now we must use one of the fields defined in the group method, since the old fields do not exist in our stats object anymore.

We can also repeat stages. This means we could add another $match stage after $sort, for example if we wanted to exclude all the documents that have the difficulty of easy:

```js
{ $match: { _id: { $ne: 'easy' } } }
```

In order to access these statistics, we simply create a new route in the tourRoutes and send JSON object from the controller to the client.
 */

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { avgPrice: 1 } },
      // Excluding all tours with difficulty easy
      // { $match: { _id: { $ne: 'easy' } } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

// BUSINESS EXAMPLE
/* In this example we assume that the company we build the website for wants a tool in order to calculate the busiest month of a given year, in order to prepare accordingly for these tours. This is why we implement a function to calculate how many tours start in each month in the given year. In our data we have the starting dates defined in an array. So what we need to do is to create one document for each of these starting dates.

In order to do this we use the unwind stage. This stage is basically deconstructing an array field and thenoutput one document for each element of the array.

In the next stage we use match so that we can select all the documents with the given year, which we pass in as a param to the route. This is why we define the range with $gte and $lt, passing in a new Date object with the first and the last day of the year.

Now we want to group the tours by the month of startingDates. In order to do this we can make use of the $month aggregation line operator. This operator will comfortably extract the month from a Date object or a Date ISO string. Now we can count the documents with $sum and passing in 1, which adds 1 for every document to the sum. If we also want to display the names of the thours of the given months, we can use the $push operator, which creates an array and pushes the name of each tour into it.

If we want to create a new field with a more meaningful name, we can make use of the $addFields stage and set the _id to new field called month. To get rid of the id, we can use the $project stage and set _id to 0.

Finall we can sort by the number of tour starts in the $sort stage.
 */

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      { $project: { _id: 0 } },
      { $sort: { numTourStarts: -1 } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
