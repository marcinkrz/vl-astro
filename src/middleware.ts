import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async ({ cookies, url, redirect }, next) => {
  if (url.pathname === "/login" || url.pathname === "/pl/login") {
    return next();
  }

  const isAuthenticated = cookies.get("site_auth")?.value === "true";

  if (!isAuthenticated) {
    return redirect("/login");
  }

  return next();
});