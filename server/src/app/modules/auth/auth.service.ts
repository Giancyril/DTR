import prisma from "../../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (body: {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "EMPLOYEE";
  department?: string;
  position?: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new Error("Email already in use");

  const hashed = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      name:       body.name,
      email:      body.email,
      password:   hashed,
      role:       body.role ?? "EMPLOYEE",
      department: body.department,
      position:   body.position,
    },
  });

  const { password: _, ...safe } = user;
  return safe;
};

export const login = async (body: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) throw new Error("Invalid email or password");

  const match = await bcrypt.compare(body.password, user.password);
  if (!match) throw new Error("Invalid email or password");

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return { token };
};

export const getUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true, name: true, email: true,
      role: true, department: true, position: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } });
};

export const updateUser = async (id: string, data: Partial<{
  name: string; department: string; position: string; role: "ADMIN" | "EMPLOYEE";
}>) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, email: true,
      role: true, department: true, position: true,
    },
  });
};

export const changePassword = async (id: string, body: {
  currentPassword: string; newPassword: string;
}) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  const match = await bcrypt.compare(body.currentPassword, user.password);
  if (!match) throw new Error("Current password is incorrect");

  const hashed = await bcrypt.hash(body.newPassword, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
  return { message: "Password updated" };
};