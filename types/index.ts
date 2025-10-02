import { SVGProps } from "react";
import NextAuth from "next-auth"

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string | null
      warehousesId?: string
    }
  }
}