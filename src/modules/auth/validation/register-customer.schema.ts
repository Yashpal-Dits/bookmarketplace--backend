import * as Joi from 'joi';

export const registerCustomerSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'First name is required',
    'string.max': 'First name must not exceed 50 characters',
  }),
  lastName: Joi.string().trim().max(50).optional().allow(''),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
  }),
  mobileNumber: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional().allow(''),
});