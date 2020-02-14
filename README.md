@signalnerve/access

(very alpha!) tooling for authenticating using cloudflare access, inside of a worker

usage:

```sh
npm install @signalnerve/access
```

```js
// in your workers script, usually index.js

addEventListener('fetch', handleRequest)

const handleRequest = async evt => {
  // Verifies the provided JWT in the request, ensuring that it's signed
  // by the Cloudflare Access public keys
  const { authorized } = await access.try(evt)
  if (authorized) {
    const resp = await fetch(evt.request)
    const emailHeader = 'cf-access-authenticated-user-email'
    resp.headers.set(emailHeader, evt.request.headers.get(emailHeader))
    return resp
  } else {
    // Return 401 unauthorized - depending on the situation, you may want 
    // to clear the JWT and re-authenticate through Access instead
    return new Response("Unauthorized", { status: 401 })
  }
}
```

this package is very beta! i've been using it to drive user authentication inside of a worker, by providing the user email as a header to the client. the api for this is _extremely_ likely to change, as this work is super related to a bunch of util-style tooling i'm writing for cloudflare workers apps right now. 

todos: 
- determine if a unique user id is available inside of the jwt (e.g. the `sub` field of the JWT)
- use html rewriter magic to embed the user auth info directly into the DOM, so that you can make auth'd requests from the client
- what happens when the JWT expires? does access catch that first, or does there need to be a refresh token process here?
- API is subject to change as i continue to explore middleware as a primitive in workers applications (probably via a light framework or something similar)
