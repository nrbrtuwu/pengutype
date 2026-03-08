import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const handler = NextAuth({
	secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
	providers: [
		DiscordProvider({
			clientId: process.env.AUTH_DISCORD_ID ?? process.env.DISCORD_CLIENT_ID ?? "",
			clientSecret: process.env.AUTH_DISCORD_SECRET ?? process.env.DISCORD_CLIENT_SECRET ?? "",
			authorization: {
				params: {
					scope: "identify",
				},
			},
		}),
	],
	session: {
		strategy: "jwt",
	},
	callbacks: {
		async jwt({ token, account, profile }) {
			if (account?.provider === "discord") {
				const profileId = profile && typeof profile === "object" && "id" in profile
					? String(profile.id)
					: undefined;
				const username = profile && typeof profile === "object" && "username" in profile
					? String(profile.username)
					: undefined;
				const globalName = profile && typeof profile === "object" && "global_name" in profile
					? String(profile.global_name)
					: undefined;
				const avatarHash = profile && typeof profile === "object" && "avatar" in profile
					? String(profile.avatar)
					: undefined;
				const avatarUrl = profileId && avatarHash
					? `https://cdn.discordapp.com/avatars/${profileId}/${avatarHash}.png?size=128`
					: undefined;
				token.discordId = profileId ?? token.sub ?? token.discordId;
				token.discordUsername = username ?? token.discordUsername;
				token.discordGlobalName = globalName ?? token.discordGlobalName;
				token.discordAvatar = avatarUrl ?? token.discordAvatar;
				token.picture = avatarUrl ?? token.picture;
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = (token.discordId as string | undefined) ?? token.sub ?? "";
				session.user.username = (token.discordUsername as string | undefined) ?? session.user.username;
				session.user.globalName = (token.discordGlobalName as string | undefined) ?? session.user.globalName;
				session.user.image = (token.discordAvatar as string | undefined) ?? token.picture ?? session.user.image;
			}

			return session;
		},
	},
});

export { handler as GET, handler as POST };
