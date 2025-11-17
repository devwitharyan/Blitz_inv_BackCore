const { param, body } = require('express-validator');

exports.uuidParam = (name = 'id') => {
  return param(name)
    .isUUID()
    .withMessage(`${name} must be a valid UUID`);
};

exports.uuidBody = (name = 'id') => {
  return body(name)
    .isUUID()
    .withMessage(`${name} must be a valid UUID`);
};
