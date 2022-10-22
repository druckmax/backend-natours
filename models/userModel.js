const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The user needs to have a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'The user needs to have an email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    unique: true,
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // Only works on CREATE and SAVE! This will not work for findByIdAndUpdate for example
      validator: function (el) {
        return el === this.password;
      },
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Update changedPasswordAt property for the user
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (candidatePW) {
  return await bcrypt.compare(candidatePW, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log(resetToken, this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// # AUTHENTICATION
/* When we are working with authentication we should never store passwords in our database as plain strings. Passwords should always be encrypted and the best place to do so is in the model.

Implementing encryption is another perfect use case for mongoose's middleware. Here we are going to use a pre-save document middleware, listening to the save trigger, so that function will be executed between getting the data and saving it to the database.

We only want to to encrypt the password when it is created or updated, but not when the user updates the email for example. We therefore use the 'isModified' method, which takes the password field in our case. When it is not modified we want to return the function and call the next middleware in the stack.

Encrypting the password is also often referred to as hashing the password. We are using a well-known hasing algorithm called 'bcrypt'. Bcrypt will first salt and then hash our password to protect it against bruteforce attacks. Salting in this case means that bcrypt is going to add a random string to the password so that two equal passwords do not generate the same hash.

First we need to install bcrypt using <code>npm i bcryptjs</code>. After requiring the module, we set the current password to <code>bcrypt.hash(this.password, 12)</code>. The second parameter is also called the cost parameter, that specifies a number of cycles to use in the algorithm, also defining how CPU-intensive this operation will be and how well the password will be encrypted. Valid values are integers between 4 and 31, it is recommended to use at least 12.

bcrypt.hash is the asynchronous version of hash, which is why we have to await it and make the callback function of pre asynchronous. We always want to use the asynchronous version for tasks like this, so that we do not block the event loop with the calculation of the encrypted data.

As a last step we want to delete the passwordConfirm field, because we do not need this information in our database, as its purpose was only to confirm that the user submitted two equal passwords. This can be simply done by setting the field to undefined. It might be confusing that we set passwordConfirm as required, but this only means that it is a required input and not that it is required to actually be persisted to the database.
Also do not confirm to call next() to forward to the next middleware.

 */
