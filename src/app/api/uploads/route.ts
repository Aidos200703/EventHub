import { NextResponse } from "next/server";
import { HttpError, withAuth } from "@/server/http";
import { saveCover } from "@/server/services/uploads";
import { COVER_MAX_BYTES } from "@/lib/constants";

export const POST = withAuth(
  async (req, user) => {
    // Reject oversized bodies before buffering them.
    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > COVER_MAX_BYTES + 64 * 1024) {
      throw new HttpError(
        413,
        "FILE_TOO_LARGE",
        `The image is too large. Maximum size is ${COVER_MAX_BYTES / 1024 / 1024} MB.`,
      );
    }
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new HttpError(400, "BAD_FORM", "Upload must be multipart/form-data");
    }
    const file = form.get("file");
    return NextResponse.json(await saveCover(user.id, file instanceof File ? file : null), {
      status: 201,
    });
  },
  { role: "ORGANIZER" },
);
