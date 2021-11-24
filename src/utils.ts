import { getTagByName } from "@kyve/core";
import Arweave from "arweave";
import { gql, request } from "graphql-request";

export const client = new Arweave({
  host: "arweave.net",
  protocol: "https",
});

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const fetchLastestHeight = async (pool: string) => {
  const query = gql`
    query FindLatestPoolTransaction($pool: String!) {
      transactions(
        tags: [
          { name: "Application", values: "KYVE - Testnet" }
          { name: "Pool", values: [$pool] }
        ]
        first: 1
      ) {
        edges {
          node {
            id
          }
        }
      }
    }
  `;

  const result = await request("https://arweave.net/graphql", query, {
    pool,
  });
  const edges = result.transactions.edges;

  if (edges.length) {
    const data = JSON.parse(
      (
        await client.transactions.getData(edges[0].node.id, {
          decode: true,
          string: true,
        })
      ).toString()
    );

    return +getTagByName("Height", data[data.length - 1].tags)!;
  } else {
    return 0;
  }
};
