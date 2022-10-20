/* eslint-disable arrow-body-style */
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  // SECURITY HAZARD: Anyone could basically log into our database as an admin
  // const user = await User.create(req.body);
  // FIX: With this code we make sure to only allow the data that we actually need
  // This prevents from register as an admin. To do so we create a new user, but need to edit the role in MongoDB Compass for example.
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2. Check if the user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3. If everything is ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1. Check if token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token)
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );

  //2. Validate the token (Verification)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user does no longer exist', 401));
  }
  //4. Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again!', 401)
    );
  }
  // Grant access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  // roles ['admin', 'lead-guide']
  return (req, res, next) => {
    console.log(req.user);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perfrom this action', 403)
      );
    }

    next();
  };
};

// # Authorization

/* After we implemented authorisation, it is time to implement authorization. We want only certain users to interact with our database for exmaple, which is why we need to authorize, basically saying give them permission, to do so. In other words we want to verify if a certain user has the rights to interact with a certain resource.

For that we need to build another middleware function, this time for restricting certain routes, for example the deleteTours route. Inside the deleteTours route we first need to pass in our protect middleware function. This will always be the first step, because we always need to check if the administrator or user is actually logged in.
After that we call middleware named 'restrictTo' which takes the role of the user as an argument, for example 'admin'.

```js
.delete(protect, restrictTo('admin'), deleteTour);
```

We need to make sure that a role field is defined in our user schema.

```js
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  }
```

Usually it is not possible to pass in arguments to a middleware function. But in our case we really need to. Therefore we need to build a wrapper function which is going to return the actual middleware function. The wrapped middleware function now gets access to the roles, which we pass in as an array using the spread operator, even after the function returned. This is a good example of a closure.

Now we check if the roles array we pass in as an argument contains the role of the current user trying to access the restricted route. If not, then we want to throw an permission error (403). We get access to the user's role, because our protect middleware runs first, in which we save the current user to the req.user property, which we now can make use of.

Remember to include the to object we pass into create, when creating a new user during signup.

```js
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  ```
 */
