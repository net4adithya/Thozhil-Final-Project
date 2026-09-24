import express from 'express';
import Joi from 'joi';
import * as candidateController from '../controllers/candidateController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

const createCandidateSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Candidate name is required'
  }),
  email: Joi.string().email({ tlds: false }).required().messages({
    'any.required': 'Candidate email is required',
    'string.email': 'Please provide a valid email address'
  }),
  role: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  status: Joi.string().valid('Invited', 'In Progress', 'Completed', 'Reviewing').default('Invited'),
  skills: Joi.array().items(Joi.string()),
  education: Joi.array(),
  experience: Joi.array(),
  projects: Joi.array()
});

const updateCandidateSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string().allow('', null),
  status: Joi.string().valid('Invited', 'In Progress', 'Completed', 'Reviewing'),
  skills: Joi.array().items(Joi.string()),
  education: Joi.array(),
  experience: Joi.array(),
  projects: Joi.array()
});

router.route('/')
  .post(validate(createCandidateSchema), candidateController.createCandidate)
  .get(candidateController.getCandidates);

router.route('/:id')
  .get(validateObjectId, candidateController.getCandidate)
  .put(validateObjectId, validate(updateCandidateSchema), candidateController.updateCandidate)
  .delete(validateObjectId, candidateController.deleteCandidate);

export default router;
