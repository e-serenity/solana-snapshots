import KYVE from "@kyve/core";
import { version } from "../package.json";
import uploadWrapper from "./upload";
import validateFunction from "./validate";

process.env.KYVE_RUNTIME = "@kyve/solana-snapshots";
process.env.KYVE_VERSION = version;

(async () => {
  const { node, options } = await KYVE.generate();
  const uploadFunction = await uploadWrapper(options.pool);

  node.run(uploadFunction, validateFunction);
})();
