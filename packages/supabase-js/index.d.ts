export type SupabaseClient = {
  url: string | undefined;
  key: string | undefined;
};

export declare function createClient(
  url: string | undefined,
  key: string | undefined
): SupabaseClient;
