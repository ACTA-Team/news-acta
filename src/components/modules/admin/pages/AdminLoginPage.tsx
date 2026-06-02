'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AuthDivider } from '@/components/blocks/auth';
import type { AdminLoginState } from '@/components/modules/admin/actions';
import { sendAdminMagicLinkAction } from '@/components/modules/admin/actions';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/InputGroup';
import { AtSignIcon } from 'lucide-react';

const initialAdminLoginState: AdminLoginState = {
  type: 'idle',
  message: '',
};

export function AdminLoginPageContent() {
  const [state, formAction, pending] = useActionState(
    sendAdminMagicLinkAction,
    initialAdminLoginState
  );

  return (
    <main className="relative w-full overflow-hidden md:h-screen">
      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-between p-6 md:p-8">
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="/black.png"
              alt=""
              width={140}
              height={40}
              className="h-10 w-auto dark:hidden"
              priority
              sizes="140px"
            />
            <Image
              src="/white.png"
              alt=""
              width={140}
              height={40}
              className="hidden h-10 w-auto dark:block"
              priority
              sizes="140px"
            />
            <span className="sr-only">ACTA home</span>
          </Link>
        </div>

        <div className="fade-in slide-in-from-bottom-4 w-full animate-in space-y-4 duration-600">
          <div className="flex flex-col space-y-1">
            <h1 className="font-bold text-2xl tracking-wide">Admin Access</h1>
            <p className="text-base text-muted-foreground">
              Authorized emails only. Admin access is email-only.
            </p>
          </div>

          <form action={formAction} className="space-y-2">
            <InputGroup>
              <InputGroupInput
                name="email"
                placeholder="editor@acta.build"
                type="email"
                required
                autoComplete="email"
              />
              <InputGroupAddon align="inline-start">
                <AtSignIcon />
              </InputGroupAddon>
            </InputGroup>

            <Button className="w-full" size="sm" type="submit" disabled={pending}>
              {pending ? 'Sending link...' : 'Continue with email'}
            </Button>
          </form>

          <AuthDivider>ADMIN ONLY</AuthDivider>
          <p className="text-xs text-muted-foreground">
            Google and GitHub are enabled for regular users, but not for admin panel access.
          </p>

          {state.type !== 'idle' ? (
            <p
              className={`text-sm ${state.type === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {state.message}
            </p>
          ) : null}
        </div>

        <p className="text-center text-muted-foreground text-sm">
          <Link className="underline underline-offset-4 hover:text-primary" href="/">
            Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
