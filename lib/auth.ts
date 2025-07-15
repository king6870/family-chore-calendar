import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true,
      })
    ] : []),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Always allow sign in - bypass any restrictions
      return true
    },
    async session({ session, user }) {
      if (session?.user && user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log("Sign in successful:", user.email)
      
      // Clean up any duplicate accounts for this email
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true }
        })
        
        if (existingUser && existingUser.accounts.length > 1) {
          // Keep only the most recent account
          const oldAccounts = existingUser.accounts.slice(0, -1)
          for (const oldAccount of oldAccounts) {
            await prisma.account.delete({ where: { id: oldAccount.id } })
          }
        }
      } catch (error) {
        console.log("Account cleanup error (non-critical):", (error as Error).message)
      }
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
}
