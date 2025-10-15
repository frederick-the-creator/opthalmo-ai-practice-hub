import type { RequestHandler} from "express";
import type { PracticeRoom } from "@/features/scheduling/practiceRoom/practiceRoom.types.js";
import {
  createPracticeRoom
} from "@/features/scheduling/practiceRoom/practiceRoom.service.js";
import type { AuthenticatedRequest } from "@/middleware/auth.middleware.js";
import type { ParamsDictionary } from "express-serve-static-core";
import { HttpError } from "@/lib/httpError.js";
import type { DeleteRoomParams, NewRoomBody, UpdateRoomBody } from "@/features/scheduling/practiceRoom/practiceRoom.schemas.js";
import { deletePracticeRoomGuarded, updatePracticeRoomGuarded } from "@/features/scheduling/practiceRoom/practiceRoom.service.js";



export const createPracticeRoomController: RequestHandler<
  ParamsDictionary,
  PracticeRoom,
  NewRoomBody
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


export const updatePracticeRoomController: RequestHandler<
	ParamsDictionary,
	PracticeRoom,
	UpdateRoomBody
> = async (req, res) => {
  if (!('supabaseAsUser' in req)) {
    throw HttpError.Unauthorized('Expected authenticated request');
  }

  const supabase = (req as AuthenticatedRequest).supabaseAsUser;
  const currentUserId = (req as AuthenticatedRequest).supabaseUser.id;

  const room = await updatePracticeRoomGuarded(supabase, currentUserId, req.body);
  res.status(201).json(room);

}


export const deletePracticeRoomController: RequestHandler<
	ParamsDictionary,
	unknown,
	DeleteRoomParams
> = async (req, res) => {
  if (!('supabaseAsUser' in req)) {
    throw HttpError.Unauthorized('Expected authenticated request');
  }

  const supabase = (req as AuthenticatedRequest).supabaseAsUser;
  const currentUserId = (req as AuthenticatedRequest).supabaseUser.id;
  const { roomId } = req.params;

  const result = await deletePracticeRoomGuarded(supabase, currentUserId, roomId);
  res.status(201).json(result);
}
