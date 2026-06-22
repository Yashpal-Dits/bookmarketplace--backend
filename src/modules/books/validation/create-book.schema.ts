import * as Joi from 'joi';

export const createBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Title is required',
    'string.max': 'Title must not exceed 200 characters',
  }),
  author: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Author is required',
    'string.max': 'Author name must not exceed 100 characters',
  }),
  description: Joi.string().trim().min(10).max(5000).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters long',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number',
  }),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'Category is required',
    'string.pattern.base': 'Invalid category ID format',
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be an integer',
    'number.min': 'Stock cannot be negative',
  }),
  isbn: Joi.string().trim().optional().allow(''),
  publisher: Joi.string().trim().max(100).optional().allow(''),
  publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()).optional(),
  language: Joi.string().trim().max(50).optional().allow(''),
  pageCount: Joi.number().integer().min(1).optional(),
});