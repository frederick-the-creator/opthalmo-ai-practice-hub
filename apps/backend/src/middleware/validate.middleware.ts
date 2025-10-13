import type { RequestHandler } from "express";
import type { ParsedQs } from "qs";
import type { ParamsDictionary } from "express-serve-static-core";
import { type ZodTypeAny } from "zod";
import { HttpError } from "@/lib/httpError.js";


export function validate(schema: ZodTypeAny): RequestHandler<ParamsDictionary, unknown, unknown, ParsedQs> {
	return async ( // Returns a function specific to schema to be used when the route is hit
		req, _res, next
	) => {
		const result = await schema.safeParseAsync({
			body: req.body,
			query: req.query,
			params: req.params,
			});

		if (!result.success) {
			const issues = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
			throw HttpError.BadRequest(`Invalid input: ${issues}`);
		}

		Object.assign(req, result.data);
		next();
	};
}


/**
 * Generic Express middleware factory for validating req.body/query/params
 * against a Zod schema. Throws HttpError.BadRequest on failure.
 *
**/

// export function validate(schema: AnyZodObject): RequestHandler {
//   return async (req, _res, next) => {
//     const result = await schema.safeParseAsync({
//       body: req.body,
//       query: req.query,
//       params: req.params,
//     });

//     if (!result.success) {
//       const issues = result.error.errors
//         .map(e => `${e.path.join(".")}: ${e.message}`)
//         .join("; ");
//       throw HttpError.BadRequest(`Invalid input: ${issues}`);
//     }

//     // Apply validated/coerced values back to the request
//     Object.assign(req, result.data);

//     return next();
//   };
// }


// export function validate(schema: AnyZodObject) {
//   return async ( // Returns a function specific to schema to be used when the route is hit
//     req: Request<unknown, unknown, unknown, unknown>,
//     _res: Response,
//     next: NextFunction
// ) {
// 	const result = await schema.safeParseAsync({
// 	body: req.body,
// 	query: req.query,
// 	params: req.params,
// 	});

// 	if (!result.success) {
// 	const issues = result.error.errors
// 		.map((e) => `${e.path.join(".")}: ${e.message}`)
// 		.join("; ");
// 	throw HttpError.BadRequest(`Invalid input: ${issues}`);
// 	}

// 	// Apply validated/coerced values back to the request
// 	Object.assign(req, result.data);

// 	next();
// 	};
// }
