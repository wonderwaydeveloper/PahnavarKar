export function getToolRoute(route: string): string {
    return route.startsWith('/home/') ? route.replace('/home/', '/') : route;
}