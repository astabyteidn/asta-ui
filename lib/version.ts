import pkg from "../package.json";

/** The kit's release version, from package.json (releases are git tags `v<version>`). */
export const VERSION: string = pkg.version;
