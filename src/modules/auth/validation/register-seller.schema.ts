import * as Joi from 'joi';

export const registerSellerSchema = Joi.object({
  businessName: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Business name is required',
  }),
  contactPerson: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Contact person is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
  }),
  mobileNumber: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).required().messages({
    'string.empty': 'Mobile number is required',
  }),
});