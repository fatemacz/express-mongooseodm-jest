import { MongoMemoryServer } from 'mongodb-memory-server';
// import process from 'process';

export default async function globalSetup() {
    const instance = await MongoMemoryServer.create({
        binary: {
            version: '6.0.4',
        },
    });
    globalThis.__MONGOINSTANCE = instance;
    process.env.DATABASE_URL = instance.getUri();
}
