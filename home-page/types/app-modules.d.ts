// Allow Next's generated type validator to import app route modules across apps
// Provide permissive declarations that include common named exports used by pages and API routes
declare module "../../../app/*" {
  const defaultExport: any;
  export default defaultExport;
  export const GET: any;
  export const POST: any;
  export const PUT: any;
  export const PATCH: any;
  export const DELETE: any;
  export const HEAD: any;
  export const OPTIONS: any;
  export const config: any;
  export const runtime: any;
  export const dynamic: any;
  export const revalidate: any;
}

declare module "../../../app/*/*" {
  const defaultExport: any;
  export default defaultExport;
  export const GET: any;
  export const POST: any;
  export const PUT: any;
  export const PATCH: any;
  export const DELETE: any;
  export const HEAD: any;
  export const OPTIONS: any;
  export const config: any;
  export const runtime: any;
  export const dynamic: any;
  export const revalidate: any;
}

declare module "../../../app/*/*/*" {
  const defaultExport: any;
  export default defaultExport;
  export const GET: any;
  export const POST: any;
  export const PUT: any;
  export const PATCH: any;
  export const DELETE: any;
  export const HEAD: any;
  export const OPTIONS: any;
  export const config: any;
  export const runtime: any;
  export const dynamic: any;
  export const revalidate: any;
}
