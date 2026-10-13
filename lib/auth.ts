import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

type DiscordProfile = {
	id?: string;
	username?: string;
	global_name?: string | null;
	avatar?: string | null;
};

export const authOptions: NextAuthOptions = {
	secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
	providers: [
		DiscordProvider({
			clientId: process.env.AUTH_DISCORD_ID ?? process.env.DISCORD_CLIENT_ID ?? "",
			clientSecret: process.env.AUTH_DISCORD_SECRET ?? process.env.DISCORD_CLIENT_SECRET ?? "",
			authorization: { params: { scope: "identify" } },
			// Discord now adds `iss=https://discord.com` to the OAuth callback (RFC 9207). openid-client then
			// requires a configured issuer to check it against, and fails the sign-in without one.
			issuer: "https://discord.com",
		}),
	],
	session: { strategy: "jwt" },
	callbacks: {
		async jwt({ token, account, profile }) {
			if (account?.provider === "discord" && profile) {
				const { id, username, global_name, avatar } = profile as DiscordProfile;
				const avatarUrl = id && avatar
					? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=128`
					: undefined;

				token.discordId = id ?? token.sub;
				token.discordUsername = username;
				token.discordGlobalName = global_name ?? undefined;
				token.picture = avatarUrl ?? token.picture;
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.discordId ?? token.sub ?? "";
				session.user.username = token.discordUsername;
				session.user.globalName = token.discordGlobalName;
				session.user.image = token.picture ?? session.user.image;
			}

			return session;
		},
	},
};
