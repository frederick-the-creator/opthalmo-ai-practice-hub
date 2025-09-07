import type { Tables } from "./dbTypes";

export type Room = Tables<"practice_rooms"> & {
    profiles?: any; // adjust as needed for joined profile info
};
export type Round = Tables<"practice_rounds">;  
export type Case = Tables<"case_briefs">;
export type Profile = Tables<"profiles">;