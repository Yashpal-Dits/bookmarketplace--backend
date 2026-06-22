import * as Joi from 'joi';

export const updateBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional().messages({
    'string.max': 'Title must not exceed 200 characters',
  }),
  author: Joi.string().trim().min(1).max(100).optional().messages({
    'string.max': 'Author name must not exceed 100 characters',
  }),
  description: Joi.string().trim().min(10).max(5000).optional(),
  price: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Price must be a positive number',
  }),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Invalid category ID format',
  }),
  stock: Joi.number().integer().min(0).optional(),
  isbn: Joi.string().trim().optional().allow(''),
  publisher: Joi.string().trim().max(100).optional().allow(''),
  publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()).optional(),
  language: Joi.string().trim().max(50).optional().allow(''),
  pageCount: Joi.number().integer().min(1).optional(),
  isAvailable: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});