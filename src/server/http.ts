import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, type CurrentUser } from "./session";

export type ApiErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string[]> };
};

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const notFound = (what = "Resource") => new HttpError(404, "NOT_FOUND", `${what} not found`);

export function jsonError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string[]>,
) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message, fields } }, { status });
}

export function toErrorResponse(err: unknown) {
  if (err instanceof HttpError) return jsonError(err.status, err.code, err.message, err.fields);
  if (err instanceof z.ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ??= []).push(issue.message);
    }
    return jsonError(
      422,
      "VALIDATION_FAILED",
      err.issues[0]?.message ?? "Please check the highlighted fields",
      fields,
    );
  }
  console.error(err);
  return jsonError(500, "INTERNAL", "Something went wrong. Please try again.");
}

type RouteCtx<P> = { params: Promise<P> };

/**
 * Wraps a route handler: resolves the user, enforces the role and converts
 * thrown HttpError / ZodError into consistent JSON responses.
 */
export function withAuth<P = Record<string, string>>(
  handler: (req: Request, user: CurrentUser, params: P) => Promise<Response>,
  options: { role?: "ORGANIZER" } = {},
) {
  return async (req: Request, ctx: RouteCtx<P>): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (!user) return jsonError(401, "UNAUTHORIZED", "Please sign in to continue");
      if (options.role && user.role !== options.role) {
        return jsonError(403, "FORBIDDEN", "This action is available to organizers only");
      }
      return await handler(req, user, await ctx.params);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "BAD_JSON", "Request body must be valid JSON");
  }
}
