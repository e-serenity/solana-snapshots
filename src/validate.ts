import { getTagByName } from "@kyve/core";
import {
  ListenFunctionObservable,
  ValidateFunctionSubscriber,
} from "@kyve/core/dist/src/faces";
import { Connection } from "@solana/web3.js";
import hash from "object-hash";
import { Logger } from "tslog";
import { ConfigType } from "./faces";

const validateFunction = (
  listener: ListenFunctionObservable,
  validator: ValidateFunctionSubscriber,
  config: ConfigType,
  logger: Logger
) => {
  logger.getChildLogger({
    name: "Solana Snapshots",
  });

  // Connect to the RPC endpoint.
  const client = new Connection(config.endpoint, { commitment: "finalized" });
  logger.info(`✅ Connection created. Endpoint = ${config.endpoint}`);

  // Subscribe to the listener.
  listener.subscribe(async (res) => {
    for (const item of res.bundle) {
      const height = +getTagByName("Height", item.tags)!;

      logger.debug(`Found slot. Height = ${height}`);

      const block = await client.getBlock(height);

      const localHash = hash(JSON.parse(JSON.stringify(block)));
      const uploaderHash = hash(JSON.parse(item.data));

      if (localHash !== uploaderHash) {
        validator.vote({
          transaction: res.transaction,
          valid: false,
        });
        return;
      }
    }

    validator.vote({
      transaction: res.transaction,
      valid: true,
    });
  });
};

export default validateFunction;
