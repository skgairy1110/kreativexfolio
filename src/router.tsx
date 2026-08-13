import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // We handle scroll position ourselves in <SmoothScroll /> (it needs to
    // reset the Lenis instance too, not just the native scrollbar), so the
    // router's built-in restoration is turned off to avoid the two fighting
    // over where the page should land after a navigation.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
