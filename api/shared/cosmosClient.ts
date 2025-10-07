import { CosmosClient, Database, Container } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT!;
const key = process.env.COSMOS_KEY!;

export const cosmosClient = new CosmosClient({ endpoint, key });

let database: Database;
let usersContainer: Container;
let projectsContainer: Container;
let timeEntriesContainer: Container;

export const initializeCosmosDB = async () => {
  const { database: db } = await cosmosClient.databases.createIfNotExists({
    id: 'TimeTrackerDB'
  });
  database = db;

  const { container: users } = await database.containers.createIfNotExists({
    id: 'users',
    partitionKey: { paths: ['/id'] }
  });
  usersContainer = users;

  const { container: projects } = await database.containers.createIfNotExists({
    id: 'projects',
    partitionKey: { paths: ['/user_id'] }
  });
  projectsContainer = projects;

  const { container: timeEntries } = await database.containers.createIfNotExists({
    id: 'timeEntries',
    partitionKey: { paths: ['/user_id'] }
  });
  timeEntriesContainer = timeEntries;

  return { usersContainer, projectsContainer, timeEntriesContainer };
};

export const getContainers = () => ({
  usersContainer,
  projectsContainer,
  timeEntriesContainer
});
