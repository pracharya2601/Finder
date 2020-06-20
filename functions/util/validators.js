//validate input
const isEmpty = (string) => {
  if (string.trim() === '') return true;
  else return false;
};

// email validate
const isEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};
const isContactNo = (num) => {
  const phono = /^\d{10}$/;
  return phono.test(num);
};

const isAge = (age) => {
  const ageInNum = parseFloat(age);
  return ageInNum >= 18 ? true : false;
};

exports.validateSignupData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = 'Email is required';
  } else if (!isEmail(data.email)) {
    errors.email = 'Must be valid email';
  }
  if (isEmpty(data.contactNo)) {
    errors.contactNo = 'Need ten digit contact number';
  } else if (!isContactNo(data.contactNo)) {
    errors.contactNo = 'Must be 10 digit num';
  }

  if (isEmpty(data.password)) errors.password = 'Password required!';
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = 'Password not match';

  if (isEmpty(data.fullName)) errors.fullName = 'Full name Required';

  if (isEmpty(data.age)) {
    errors.age = 'Age is required';
  } else if (isAge(data.age) == false) {
    errors.age = 'You must be over 18 years of age.';
  }

  if (isEmpty(data.handle)) errors.handle = 'Username required';

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) errors.email = 'Must not be empty';
  if (isEmpty(data.password)) errors.password = 'Must not be empty';

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }
  if (!isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
};
