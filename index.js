import cookie from "cookie";
import jose from "node-jose";

const DEFAULT_CONFIG = { debug: false, verification: {} };

export default class AccessAuthorizer {
  constructor(config = DEFAULT_CONFIG) {
    this._config = config;
  }

  log(message) {
    if (this._config.debug == true) {
      console.log(`[ACCESS_AUTHORIZER]: ${message}`);
    }
  }

  try(evt) {
    this.log("Trying to run middleware");
    this.log(JSON.stringify(evt));

    return new Promise(async (resolve, reject) => {
      const cookiesHeader = evt.request.headers.get("Cookie") || "";
      const cookies = cookie.parse(cookiesHeader);
      this.log(`Parsed cookies: ${cookies}`);

      try {
        const authCookie = cookies["CF_Authorization"];
        if (!authCookie)
          throw new Error("CF_Authorization wasn't found in cookie");

        this.log(`Found CF_Authorization: ${authCookie}`);

        const certificate_url = this._config.verification.certificateUrl;
        this.log(`Requesting certs from ${certificate_url}`);
        const resp = await fetch(certificate_url);
        const { keys } = await resp.json();
        this.log(`Requested verification keys, received ${keys.length}`);
        this.log(`Verifying...`);

        const keyStore = await jose.JWK.asKeyStore(keys);
        this.log(`Created key store: ${JSON.stringify(keyStore)}`);
        let { payload } = await jose.JWS.createVerify(keyStore).verify(
          authCookie
        );
        payload = jose.util.base64url.encode(payload);

        return resolve({ authorized: true, event: evt, payload });
      } catch (err) {
        this.log("Unable to authorize, rejecting promise");
        reject(err);
      }
    });
  }
}
