import * as Joi from 'joi';

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});