/***** REFACTOR DEMONSTRATION COMPONENT *****/
import React, { useCallback, useState } from 'react';
import { WorldObjects } from '../../worldObjects';
import type { Game } from '../../utilities/game/game';
import type { BaseSpruceTree } from '../../objects/spruceTree/base';
import type { BaseAssembler } from '../../objects/assembler/factory';

/***** TYPE DEFINITIONS *****/
interface EntityPlacementDemoProps {
  game: Game;
}

interface PlacedEntity {
  id: string;
  type: 'spruceTree' | 'assembler';
  x: number;
  y: number;
  isLocal: boolean;
  entity: BaseSpruceTree | BaseAssembler;
}

/***** COMPONENT *****/
export const EntityPlacementDemo: React.FC<EntityPlacementDemoProps> = ({ game }) => {
  const [placedEntities, setPlacedEntities] = useState<Array<PlacedEntity>>([]);
  const [isPlacing, setIsPlacing] = useState(false);

  /***** EVENT HANDLERS *****/
  const placeSpruceTreeLocal = useCallback(async () => {
    const x = Math.random() * 1000;
    const y = Math.random() * 1000;
    
    try {
      const entity = WorldObjects.spruceTree.createLocal({ x, y, game });
      
      setPlacedEntities(prev => [...prev, {
        id: entity.uid,
        type: 'spruceTree',
        x,
        y,
        isLocal: true,
        entity
      }]);
      
      console.log(`Placed local spruce tree at (${x}, ${y})`);
    } catch (error) {
      console.error('Failed to place local spruce tree:', error);
    }
  }, [game]);

  const placeSpruceTreeNetworked = useCallback(async () => {
    setIsPlacing(true);
    const x = Math.random() * 1000;
    const y = Math.random() * 1000;
    
    try {
      const entity = await WorldObjects.spruceTree.createNetworked({ x, y, game });
      
      setPlacedEntities(prev => [...prev, {
        id: entity.uid,
        type: 'spruceTree',
        x,
        y,
        isLocal: false,
        entity
      }]);
      
      console.log(`Placed networked spruce tree at (${x}, ${y})`);
    } catch (error) {
      console.error('Failed to place networked spruce tree:', error);
    } finally {
      setIsPlacing(false);
    }
  }, [game]);

  const placeAssemblerNetworked = useCallback(async () => {
    setIsPlacing(true);
    const x = Math.random() * 1000;
    const y = Math.random() * 1000;
    
    try {
      const entity = await WorldObjects.assembler.createNetworked({ x, y, game });
      
      setPlacedEntities(prev => [...prev, {
        id: entity.uid,
        type: 'assembler',
        x,
        y,
        isLocal: false,
        entity
      }]);
      
      console.log(`Placed networked assembler at (${x}, ${y})`);
    } catch (error) {
      console.error('Failed to place networked assembler:', error);
    } finally {
      setIsPlacing(false);
    }
  }, [game]);

  const castToNetworked = useCallback(async (entityInfo: PlacedEntity) => {
    if (!entityInfo.isLocal) {
      console.warn('Entity is already networked');
      return;
    }
    
    setIsPlacing(true);
    
    try {
      let newEntity: BaseSpruceTree | BaseAssembler;
      
      if (entityInfo.type === 'spruceTree') {
        newEntity = await WorldObjects.spruceTree.castToNetworked(entityInfo.entity as BaseSpruceTree, { game });
      } else {
        newEntity = await WorldObjects.assembler.castToNetworked(entityInfo.entity as BaseAssembler, { game });
      }
      
      // Update the entity in our list
      setPlacedEntities(prev => prev.map(item => 
        item.id === entityInfo.id 
          ? { ...item, entity: newEntity, isLocal: false, id: newEntity.uid }
          : item
      ));
      
      console.log(`Converted ${entityInfo.type} to networked`);
    } catch (error) {
      console.error('Failed to cast to networked:', error);
    } finally {
      setIsPlacing(false);
    }
  }, [game]);

  const clearAllEntities = useCallback(() => {
    // Destroy all entities
    for (const entityInfo of placedEntities) {
      try {
        game.worldManager.destroyEntity(entityInfo.entity);
      } catch (error) {
        console.error('Failed to destroy entity:', error);
      }
    }
    
    setPlacedEntities([]);
    console.log('Cleared all entities');
  }, [game, placedEntities]);

  /***** RENDER *****/
  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: 20, 
      borderRadius: 8,
      minWidth: 300,
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <h3>🌍 World Object Factory Demo</h3>
      
      <div style={{ marginBottom: 20 }}>
        <h4>📦 Create Entities:</h4>
        <button 
          onClick={placeSpruceTreeLocal}
          disabled={isPlacing}
          style={{ margin: 5, padding: 8 }}
        >
          🌲 Local Spruce Tree
        </button>
        
        <button 
          onClick={placeSpruceTreeNetworked}
          disabled={isPlacing}
          style={{ margin: 5, padding: 8 }}
        >
          🌲 Networked Spruce Tree
        </button>
        
        <button 
          onClick={placeAssemblerNetworked}
          disabled={isPlacing}
          style={{ margin: 5, padding: 8 }}
        >
          🏭 Networked Assembler
        </button>
        
        <button 
          onClick={clearAllEntities}
          disabled={isPlacing}
          style={{ margin: 5, padding: 8, backgroundColor: '#ff4444' }}
        >
          🗑️ Clear All
        </button>
      </div>

      <div>
        <h4>📊 Placed Entities ({placedEntities.length}):</h4>
        {placedEntities.length === 0 ? (
          <p style={{ color: '#888' }}>No entities placed yet</p>
        ) : (
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {placedEntities.map((entityInfo) => (
              <div 
                key={entityInfo.id}
                style={{ 
                  marginBottom: 10, 
                  padding: 10, 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  fontSize: 12
                }}
              >
                <div><strong>{entityInfo.type}</strong></div>
                <div>ID: {entityInfo.id.substring(0, 8)}...</div>
                <div>Position: ({Math.round(entityInfo.x)}, {Math.round(entityInfo.y)})</div>
                <div>Type: {entityInfo.isLocal ? '📍 Local' : '🌐 Networked'}</div>
                
                {entityInfo.isLocal && (
                  <button 
                    onClick={() => castToNetworked(entityInfo)}
                    disabled={isPlacing}
                    style={{ 
                      marginTop: 5, 
                      padding: 4, 
                      fontSize: 10,
                      backgroundColor: '#4CAF50'
                    }}
                  >
                    Cast to Networked
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {isPlacing && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8
        }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div>⏳ Creating entity...</div>
            <div style={{ fontSize: 12, marginTop: 5 }}>
              Communicating with server
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
