'use client';

import Image from "next/image";
import { signOut } from "@/app/actions/auth";

interface User {
    id: string;
    email?: string;
    user_metadata?: {
        avatar_url?: string;
    };
}

interface UserDropdownProps {
    user: User;
}

export default function UserDropdown({ user }: UserDropdownProps) {
    return (
        <details className="relative group">
            <summary className="list-none cursor-pointer">
                <div className="flex items-center justify-center bg-[#fffefb] border-2 border-foreground rounded-full w-12 h-12 shadow-sm hover:shadow-md transition-shadow">
                    {user.user_metadata?.avatar_url ? (
                        <Image
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full border border-foreground"
                            unoptimized
                        />
                    ) : (
                        <div className="w-10 h-10 bg-earth-sage rounded-full border border-foreground flex items-center justify-center text-white font-funky text-lg">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    )}
                </div>
            </summary>
            <div className="absolute right-0 mt-2 w-48 bg-[#fffefb] border-2 border-foreground rounded-lg shadow-lg py-2 z-50">
                <form action={signOut}>
                    <button
                        type="submit"
                        className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-earth-sage/10 hover:text-earth-terracotta transition-colors"
                    >
                        Log Out
                    </button>
                </form>
            </div>
        </details>
    );
}
