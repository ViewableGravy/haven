
# Saving world state
I am ready to add in the ability to save the world state on the server.

## Overview
This game is going to be an MMO where there is one server and many clients. The client doesn't store data on their device currently, as they will receive information from the server when they first join, 
explaining what needs to be added into the world, so that the client can perform these actions.

The server only needs a database for now, it does not need in memory or quick access information.

Note: For now, the database storage can just be an object - however we will need to store data using some spatial storage mechanism in the future.

## Current implementation details
I would recommend making some helper functions to access the "database" object so that when it is replaced with an actual DB, we do not have to re-write that code. Ideally we would "query" it using the x/y position and 
a radius - similar to how the current chunk manager works, but on the backend.

I want to store the data in the server in a spatial manner - such that we can easily access it based on where the client is, since retrieving the entire world state is likely not feasible.
A `quad tree` implementation may be useful for this - I have an implementation at `https://github.com/ViewableGravy/quad-tree` that we could use, or a new one will also work. Alternatively if that adds a lot of scope,
I would be happy to just use an object and implement functions for querying that still accept x,y,w,h, but just internally fetch everything.

## Flow from client to server
When a client adds something in the world, the following flow should happen
1. Client places on local (this happens immediately)
2. Event is sent to the server
3. Server does 2 things
  1. Notifies all other clients of the update so they can add it in
  2. Updates the database with the newly added entity

4. (Optional) If this is memory efficient, it may be a good idea to send local chunk updates from the server every now and then so that the client can update and ensure they are matched with the server, in 
case there was a missed event or something has desynced. This may not be reasonable bandwidth wise though.

## Flow for client joining the server
When a client joins, the following flow should happen
1. Client joins the world
2. Server notifies other clients of the client joining
3. Server sends client chunk data for all chunks around client (let's assume we need 10x10 chunks for now)
4. Chunks render on client

## Notes
1. The chunk manager is quite static currently. This will need to work with the server to load in the chunks that the server says they are allowed. The client should not specify anything about what they are allowed, this is something that the server would send based on the players position which it should store. For example, if the player is at 100,100 then the server would send a message (likely several) that include information about their chunks (note that the seed can be used for background of the chunks on the client since this cannot be changed ever).

The messages may looks something like (pseudo code, obviously use the relevant data for entities)
```ts
{
  type: "new_chunk":
  data: {
      chunk: {
        x: 0,
        y: 0,
      },
      entities: [
        {
          assembler: {
            positionTrait: ...,
          ghostTrait: ...,
          ...
        }
      }
    ]
  }
}
```

I don't think `remove_chunk` is necessary, since this would automatically happen as the user moves around and can be cleaned up on the frontend.

2. We only want to send information to clients about events happening in their area. If a player is more than 10 chunks away, we don't need their events.
3. Server will need to store player positions so that it can determine whether an event is necessary for the player.

# Final note
Can you please consider how this might be best broken down into smaller pieces of work and give me a document overview of how you will approach this - including making several branches or commits on a branch if necessary as well as keeping me updated on the process.
I also want this code to be maintainable and reusable, so for constants and shared things between the server and client and between systems, keep this in mind and avoid writing unecessary duplicate code.
