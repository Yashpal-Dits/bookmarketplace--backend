import * as Joi from 'joi';

export const bookQuerySchema = Joi.object({
  search: Joi.string().trim().optional().allow(''),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Invalid category ID format',
  }),
  minPrice: Joi.number().positive().optional(),
  maxPrice: Joi.number().positive().optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  sort: Joi.string().valid('title', 'author', 'price', 'createdAt', 'stock').default('createdAt').optional(),
  order: Joi.string().valid('asc', 'desc').default('desc').optional(),
});