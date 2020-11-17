const {body} = require('express-validator/check');

module.exports = {
  checkForm: [
    //Form validation
    body('name', 'Name field is required').exists(),
    body('email', 'Email field is required').exists(),
    body('email', 'Email is not valid').isEmail(),
    body('username', 'Username field is required').exists(),
    body('password2').custom((value, { req }) => value === req.body.password)
  ]
}