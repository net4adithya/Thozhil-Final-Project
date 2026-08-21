import express from 'express';
import Joi from 'joi';
import * as jobController from '../controllers/jobController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

const createJobSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Job title is required'
  }),
  description: Joi.string().required().messages({
    'any.required': 'Job description is required'
  }),
  department: Joi.string().required().messages({
    'any.required': 'Hiring department is required'
  }),
  experienceLevel: Joi.string().allow('', null),
  requiredSkills: Joi.array().items(Joi.string()),
  preferredSkills: Joi.array().items(Joi.string()),
  location: Joi.string().allow('', null),
  employmentType: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'),
  status: Joi.string().valid('Active', 'Draft', 'Closed')
});

const updateJobSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  department: Joi.string(),
  experienceLevel: Joi.string().allow('', null),
  requiredSkills: Joi.array().items(Joi.string()),
  preferredSkills: Joi.array().items(Joi.string()),
  location: Joi.string().allow('', null),
  employmentType: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'),
  status: Joi.string().valid('Active', 'Draft', 'Closed')
});

router.route('/')
  .post(validate(createJobSchema), jobController.createJob)
  .get(jobController.getJobs);

router.route('/:id')
  .get(validateObjectId, jobController.getJob)
  .put(validateObjectId, validate(updateJobSchema), jobController.updateJob)
  .delete(validateObjectId, jobController.deleteJob);

export default router;
