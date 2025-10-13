import {Router} from 'express'
import { requireSupabaseUser } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.middleware.js'
import { newRoomSchemaAPI, updateRoomSchemaAPI, deleteRoomSchemaAPI } from '@/features/scheduling/practiceRoom/practiceRoom.schemas.js';
import { createPracticeRoomController, updatePracticeRoomController, deletePracticeRoomController } from '@/features/scheduling/practiceRoom/practiceRoom.controller.js'


const roomRouter = Router()

// Router
/*
All middleware passed must be a function that returns void and accepts the standard typed parameters (req: Request, res: Response, next: NextFunction) => void
  - requireSupabaseUser - Sync wrapper function that when run it triggers the nested async IIFE (Immediately Invoked Function Expression)
  - validate(newRoomSchemaAPI) - Calling validate at startup / runtime returns a function specific to newRoomSchemaAPI ready to be called when the route is hit. 
*/
roomRouter.post(
	'/create',
	requireSupabaseUser, // Authenticate user
	validate(newRoomSchemaAPI), // Add room parser using Zod to guarantee req.body is correct schema at runtime
	createPracticeRoomController
);

roomRouter.post(
    '/update',
    requireSupabaseUser,
    validate(updateRoomSchemaAPI),
    updatePracticeRoomController
);

// Delete room endpoint: deletes dependent rounds then the room
roomRouter.delete(
  '/:roomId',
  requireSupabaseUser,
  validate(deleteRoomSchemaAPI),
  deletePracticeRoomController
);

export default roomRouter