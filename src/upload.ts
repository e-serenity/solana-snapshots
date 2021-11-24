import { UploadFunctionSubscriber } from "@kyve/core/dist/src/faces";
import { Connection } from "@solana/web3.js";
import { Logger } from "tslog";
import { ConfigType } from "./faces";
import { fetchLastestHeight } from "./utils";

const uploadWrapper = async (pool: string) => {
  let height = await fetchLastestHeight(pool);

  const uploadFunction = (
    uploader: UploadFunctionSubscriber,
    config: ConfigType,
    logger: Logger
  ) => {
    logger = logger.getChildLogger({
      name: "Solana Snapshots",
    });

    const client = new Connection(config.endpoint, { commitment: "finalized" });
    logger.info(`✅ Connection created. Endpoint = ${config.endpoint}`);

    const main = async () => {
      const currentHeight = await client.getSlot();
      logger.info(
        `👀 Starting to archive slots ${height} to ${currentHeight}.`
      );

      for (let i = height; i < currentHeight; i++) {
        const block = await client.getBlock(i);

        if (block) {
          const tags = [
            { name: "Block", value: block.blockhash },
            { name: "Height", value: i.toString() },
          ];
          block.transactions.forEach(({ transaction }) =>
            tags.push({
              name: "Transaction",
              value: transaction.signatures[0],
            })
          );

          uploader.upload({
            data: JSON.stringify(block),
            tags,
          });
        }

        height = currentHeight + 1;
      }

      setTimeout(main, 1000 * 60 * 10);
    };

    main();
  };

  return uploadFunction;
};

export default uploadWrapper;
