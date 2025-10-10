import type { RequestHandler} from "express";
import type { PracticeRoom } from "@/features/practiceRoom/practiceRoom.types.js";
import {
  createPracticeRoom
} from "@/features/practiceRoom/practiceRoom.service.js";
import type { AuthenticatedRequest } from "@/utils/supabaseClient.js";
import type { ParamsDictionary } from "express-serve-static-core";
import { HttpError } from "@/lib/httpError.js";
import type { DeleteRoomParams } from "@/features/practiceRoom/practiceRoom.schemas.js";
import { deletePracticeRoomGuarded, updatePracticeRoomGuarded } from "@/features/practiceRoom/practiceRoom.service.js";
import { CreatePracticeRoom, UpdatePracticeRoom } from '@/features/practiceRoom/practiceRoom.types.js';

export const createPracticeRoomController: RequestHandler<
  ParamsDictionary,
  PracticeRoom,
  CreatePracticeRoom
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
	UpdatePracticeRoom
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
