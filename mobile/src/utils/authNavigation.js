/**
 * Post-login routing: new users set a password; returning users go home.
 */
export function routeAfterAuth(router, user) {
  if (!user?.has_password) {
    router.replace('/password-setup');
    return;
  }
  router.replace('/(tabs)/home');
}
