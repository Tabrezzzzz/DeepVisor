alter role authenticator set pgrst.db_schemas = 'public,graphql_public,ai';
alter role authenticator set pgrst.db_extra_search_path = 'public,extensions';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
