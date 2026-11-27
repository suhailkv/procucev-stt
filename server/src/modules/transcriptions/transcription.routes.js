import { createRouter } from '../../lib/http.js';
import { transcriptionService as service } from './transcription.service.js';
import { createBody, idParam, listQuery, updateBody } from './transcription.schema.js';

export const transcriptionRouter = createRouter();

transcriptionRouter.get('/', async (req, res) => {
  res.json(await service.list(listQuery.parse(req.query)));
});

transcriptionRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.get(id));
});

transcriptionRouter.post('/', async (req, res) => {
  res.status(201).json(await service.create(createBody.parse(req.body ?? {})));
});

transcriptionRouter.put('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.update(id, updateBody.parse(req.body ?? {})));
});

transcriptionRouter.delete('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  await service.remove(id);
  res.status(204).end();
});
