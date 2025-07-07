## File Structure

```
preLoadComp/
├── index.ts                 # Main exports
├── preLoadComp.tsx          # Main PreloadComp class
├── types.ts                 # TypeScript interfaces and types
├── styled.tsx               # Styled components
├── utils.ts                 # Utility functions
├── components.tsx           # Component classes (LibsComp, ScriptComp, etc.)
├── tabPanes.tsx             # Tab pane components
├── preloadConfigModal.tsx   # Modal configuration component
├── actionInputSection.tsx   # Component placement functionality
├── actionConfigs.ts         # Action configurations (scalable action system)
├── ACTION_SYSTEM.md         # Action system documentation
└── README.md               # This documentation
```

## Components

### Core Components
- **`preLoadComp.tsx`**: Main `PreloadComp` class that orchestrates all functionality
- **`components.tsx`**: Contains all component classes (`LibsComp`, `ScriptComp`, `CSSComp`, `GlobalCSSComp`)

### UI Components
- **`preloadConfigModal.tsx`**: Modal with tabs for JavaScript, CSS, and Global CSS
- **`tabPanes.tsx`**: Individual tab pane components for JavaScript and CSS
- **`actionInputSection.tsx`**: Component placement functionality with dropdowns

### Supporting Files
- **`types.ts`**: TypeScript interfaces and enums
- **`styled.tsx`**: Styled-components for consistent styling
- **`utils.ts`**: Utility functions for component generation and script execution
- **`index.ts`**: Centralized exports for easy importing

## Key Features

### Component Placement
The `ActionInputSection` component provides:
- Dropdown selection of available components
- Categorized component listing
- Automatic component placement in the editor
- Success/error feedback

### Scalable Action System
The action system has been completely refactored to be configuration-driven:
- **Easy to Extend**: Add new actions by simply adding configuration objects
- **Type Safe**: Full TypeScript support with proper interfaces
- **Validation**: Built-in input validation support
- **Categorized**: Actions organized into logical categories
- **Flexible**: Support for different input types and requirements

See `ACTION_SYSTEM.md` for detailed documentation on adding new actions.

### Script and Style Management
- JavaScript library loading and management
- CSS and Global CSS application
- Script execution in host or sandbox environment

### Modular Architecture
- **Separation of Concerns**: Each file has a single responsibility
- **Reusability**: Components can be imported and used independently
- **Maintainability**: Easy to locate and modify specific functionality
- **Type Safety**: Comprehensive TypeScript interfaces

## Usage

```typescript
// Import the main component
import { PreloadComp } from "./preLoadComp";

// Import specific components
import { ActionInputSection } from "./preLoadComp/actionInputSection";
import { PreloadConfigModal } from "./preLoadComp/preloadConfigModal";

// Import utilities
import { generateComponentActionItems } from "./preLoadComp/utils";

// Import types
import type { ExternalPreload, RunAndClearable } from "./preLoadComp/types";
```

## Benefits of Restructuring

1. **Maintainability**: Each file is focused and easier to understand
2. **Reusability**: Components can be used independently
3. **Testing**: Individual components can be tested in isolation
4. **Collaboration**: Multiple developers can work on different parts simultaneously
5. **Code Organization**: Clear separation of concerns
6. **Type Safety**: Better TypeScript support with dedicated type files

## Migration Notes

The original `preLoadComp.tsx` file now simply exports from the new modular structure, ensuring backward compatibility while providing the benefits of the new organization. 