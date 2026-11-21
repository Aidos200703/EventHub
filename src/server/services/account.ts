import "server-only";
import { profileSchema } from "@/lib/validation/account";
import { prisma } from "../db";

export async function getProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      city: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function updateProfile(userId: string, raw: unknown) {
  const data = profileSchema.parse(raw);
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { name: true, phone: true, city: true, bio: true },
  });
}
