import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import onlinePrisma from "@/lib/onlinePrisma";
import prisma from "@/lib/oflinePrisma";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const { email, password, type } = credentials;

        if (type == "warehouse") {
          // ✅ Warehouse login logic
          const user = await prisma.users.findUnique({ where: { userName: email,isDeleted:false } });
          if (!user) return null;
          const compareHash = await bcrypt.compare(password, user.password);

          if (compareHash) {
            return user;
          } else {
            return null;
          }
        } else {
          // ✅ Admin login logic
          const user = await onlinePrisma.superAdmin_online.findUnique({ where: { email: email,isDeleted:false } });
          console.log("no")
          if (!user) return null;
          console.log("ok")
          if (user.password === password) {
            return user;
          } else {
            return null;
          }
          return user;
          
        }
      }
    })
  ],
  pages: {
    signIn: "/login", // fallback login page
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.warehousesId = user.warehousesId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.warehousesId = token.warehousesId;
      return session;
    },
  }
});

export { handler as GET, handler as POST };
