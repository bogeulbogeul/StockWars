// Clear gameplay storage before loading the renderer; retain the online session token.
async function resetTestStorage(session) {
  await session.clearStorageData({ storages: ['localstorage', 'indexdb', 'websql'] });
}
module.exports = { resetTestStorage };
