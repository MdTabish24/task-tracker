import bcrypt from "bcrypt";

const COST = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, COST);
