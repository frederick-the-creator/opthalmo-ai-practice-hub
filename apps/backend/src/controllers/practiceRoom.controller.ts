import type { RequestHandler} from "express";
import type { PracticeRoom } from "@/types/index.js";
import type { NewRoom } from "@/validation/practiceRoom.schemas.js";
import {
  createPracticeRoom
} from "@/services/practiceRoom/practiceRoom.service.js";
import { AuthenticatedRequest } from "@/utils/supabaseClient.js";
import type { ParamsDictionary } from "express-serve-static-core";
import { HttpError } from "@/lib/httpError.js";


export const createPracticeRoomController: RequestHandler<
  ParamsDictionary,
  PracticeRoom,
  NewRoom
> = async (req, res) => {
    // if this route is ever mounted without the auth middleware,
    // fail fast and hand off to the error middleware
    if (!('supabaseAsUser' in req)) {
      throw HttpError.Unauthorized('Expected authenticated request');
    }

    const supabase = (req as AuthenticatedRequest).supabaseAsUser;
    const room = await createPracticeRoom(supabase, req.body);

    res.status(201).json(room);
}


