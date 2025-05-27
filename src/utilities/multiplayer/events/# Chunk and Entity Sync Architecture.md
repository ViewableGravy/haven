# Note

Currently have implemented the `load_chunk` client side event, this should probably work but is untested. This will create the chunk using the chunk Manager, and then create the entities using the entitySync which will add them to the chunk

We now need to remove all client side chunk generation logic in favor of server side (with caching where we store the chunks after they are generated the first time so that we don't need to re-calculate the chunk every time we run in).

Once that is done, we should send the client the chunks that are around them for the client to load in.

No generation should be done on the client, just taking the data, making pxii objects and continuing. Client can cleanup unused chunks since we know the chunk radius on client.

Note: At this stage, we will need to start storing entities on the server so they can also be properly pushed to the client.