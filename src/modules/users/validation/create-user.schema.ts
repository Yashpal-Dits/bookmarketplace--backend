import * as Joi from 'joi';
import { Role } from '../../../common/constants/roles.constant';

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password must not exceed 128 characters',
  }),
  role: Joi.string()
    .valid(...Object.values(Role))
    .optional()
    .messages({
      'any.only': 'Role must be one of: user, seller, admin',
    }),
});