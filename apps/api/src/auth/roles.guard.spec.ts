import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const contextFor = (role?: string) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => (role ? { user: { role } } : {}),
      }),
    }) as unknown as ExecutionContext;

  const guardRequiring = (roles: string[] | undefined) => {
    const reflector = {
      getAllAndOverride: () => roles,
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('lets anyone through when the handler declares no role', () => {
    expect(guardRequiring(undefined).canActivate(contextFor('THERAPIST'))).toBe(
      true,
    );
  });

  it('lets an ADMIN through an ADMIN-only handler', () => {
    expect(guardRequiring(['ADMIN']).canActivate(contextFor('ADMIN'))).toBe(
      true,
    );
  });

  it('forbids a THERAPIST on an ADMIN-only handler', () => {
    expect(() =>
      guardRequiring(['ADMIN']).canActivate(contextFor('THERAPIST')),
    ).toThrow(ForbiddenException);
  });
});
