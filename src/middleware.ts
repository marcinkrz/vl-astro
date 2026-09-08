import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async ({ cookies, url, redirect }, next) => {
  if (!import.meta.env.PROD) { return next(); }

  if (url.pathname === "/login" || url.pathname === "/pl/login" || url.pathname === "/cs" || url.pathname === "/pl/cs") {
    return next();
  }

  const isAuthenticated = cookies.get("site_auth")?.value === "true";
  if (!isAuthenticated) {
    return redirect("/cs");
  }

  return next();
});