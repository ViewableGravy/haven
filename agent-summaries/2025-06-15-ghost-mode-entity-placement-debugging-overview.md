```
  ______ _    _  ____   _____ _______   __  __  ____  _____  ______ 
 / ____|  |  | |/ __ \ / ____|__   __| |  \/  |/ __ \|  __ \|  ____|
| |  __| |__| | |  | | (___|   | |    | \  / | |  | | |  | | |__   
| | |_ |  __  | |  | |\___ \   | |    | |\/| | |  | | |  | |  __|  
| |__| | |  | | |__| |____) |  | |    | |  | | |__| | |__| | |____ 
 \_____|_|  |_|\____/|_____/   |_|    |_|  |_|\____/|_____/|______|
                                                                   
 ______ _   _ _______ _____ _________     __                        
|  ____| \ | |__   __|_   _|__   __\ \   / /                       
| |__  |  \| |  | |    | |    | |   \ \_/ /                        
|  __| | . ` |  | |    | |    | |    \   /                         
| |____| |\  |  | |   _| |_   | |     | |                          
|______|_| \_|  |_|  |_____|  |_|     |_|                          
                                                                   
______ _      _____ _____ ______ __  __ ______ _   _ _______        
|  ____| |    |  _  |  ___|  ____| \  /  |  ____| \ | |__   __|      
| |__  | |    | |_| | |   | |__  | |\/| | |__  |  \| |  | |         
|  __| | |    |  _  | |   |  __| | |  | |  __| | . ` |  | |         
| |    | |____| | | | |___| |____| |  | | |____| |\  |  | |         
|_|    |______|_| |_|_____|______|_|  |_|______|_| \_|  |_|         
                                                                   
 ____  _    _  _____ _____ _____ _   _  _____                       
|  _ \| |  | |/ ____|  __ \_   _| \ | |/ ____|                      
| |_) | |  | | |  __| |  | || | |  \| | |  __                       
|  _ <| |  | | | |_ | |  | || | | . ` | | |_ |                      
| |_) | |__| | |__| | |__| || |_| |\  | |__| |                      
|____/ \____/ \_____|_____/_____|_| \_|\_____|                      
```

## High Level Overview

The ghost mode entity placement system had multiple critical bugs: a double-click requirement for ghost preview to appear, entities failing to actually place in the world, assemblers not working at all, and inability to select the same hotbar item twice in a row after placement. The root causes were problematic toggle logic in the hotbar selection system, improper cleanup sequencing in the mouse follower, missing networked creator function for assemblers, and selection state not being cleared after entity placement.

The fix involved removing the toggle behavior that caused repeated clicking issues, correcting the entity placement flow, adding proper networked creation for assemblers, and ensuring selection state is properly cleared after placement to allow immediate re-selection of the same hotbar item.

## Files That Were Modified

- `src/utilities/mouseFollower/index.ts` - Fixed entity placement flow, added selection clearing, and removed debug logging
- `src/components/hotbar/HotbarItem.tsx` - Removed toggle behavior and debug logging
- `src/components/hotbar/hooks.ts` - Removed debug logging from keyboard shortcuts
- `src/objects/assembler/index.ts` - Added createNetworkedAssembler function and updated infographic registration

## Diagram of Changes

```
[Key Press 1/2] 
       ↓
[Input Handler] → [FIXED: No more toggle logic]
       ↓
[Ghost Mode State] → [FIXED: Direct selection]
       ↓
[Ghost Preview] → [Shows immediately]
       ↓
[Click to Place] → [FIXED: Cleanup first, then create]
       ↓
[Entity Creation] → [Networked entity created]
       ↓
[World Registration] → [Entity appears in world]
```

## Final Information

The key fixes were:
1. **Double-click issue**: Removed the toggle logic that deselected items when clicked again - now only Escape deselects
2. **Entity placement**: Changed the flow to cleanup the preview entity FIRST, then create the networked entity, ensuring proper state management
3. **Assembler not working**: Added `createNetworkedAssembler` function and updated infographic registration to use it for networked entity creation
4. **Cannot select same item twice**: Added `clearSelection()` call to mouse follower cleanup to reset selection state after placement

The system now correctly follows the intended flow: pressing 1/2 creates a local preview entity in ghost mode, clicking to place cleans up the preview and creates a networked entity that appears in the world, and the selection is cleared allowing immediate re-selection of the same hotbar item.
