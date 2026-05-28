import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async ({ cookies, request, url, redirect }, next) => {
  if (url.pathname !== "/login") {
    const authCookie = cookies.get("site_auth");

    if (!authCookie || authCookie.value !== "true") {
      return redirect("/login");
    }
  }

  return next();
})
