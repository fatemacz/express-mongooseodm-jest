export default async function globalTeardown() {
    await globalThis.__MONGOINSTANCE.stop();
}
