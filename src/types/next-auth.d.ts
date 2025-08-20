import type { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface Session {
		user: DefaultSession["user"] & {
			id: string;
			role: "owner" | "admin" | "user";
		};
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		role?: "owner" | "admin" | "user";
	}
}

