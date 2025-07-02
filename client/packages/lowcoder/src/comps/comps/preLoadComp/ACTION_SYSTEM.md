## Architecture

### Core Components

1. **ActionConfig Interface** - Defines the structure of an action
2. **ActionRegistry** - Central registry of all available actions
3. **ActionInputSection** - Main UI component that renders based on action configurations

### Key Benefits

- **Scalable**: Add new actions by simply adding a configuration object
- **Type Safe**: Full TypeScript support with proper interfaces
- **Validation**: Built-in input validation support
- **Categorized**: Actions are organized into logical categories
- **Flexible**: Support for different input types and requirements

## Adding New Actions

### Step 1: Define the Action Configuration

Add a new action configuration in `actionConfigs.ts`:

```typescript
const myNewAction: ActionConfig = {
  key: 'my-new-action',
  label: 'My New Action',
  category: 'my-category',
  requiresEditorComponentSelection: true, // if it needs a component from editor
  requiresInput: true, // if it needs user input
  inputPlaceholder: 'Enter your input here',
  inputType: 'text', // 'text', 'number', 'textarea', 'json'
  validation: (value: string) => {
    if (!value.trim()) return 'Input is required';
    return null; // null means no error
  },
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, actionValue, editorState } = params;
    
    // Your action logic here
    console.log('Executing my new action:', selectedEditorComponent, actionValue);
    
    // Show success message
    message.success('Action executed successfully!');
  }
};
```

### Step 2: Add to Category

Add your action to an existing category or create a new one:

```typescript
export const actionCategories: ActionCategory[] = [
  // ... existing categories
  {
    key: 'my-category',
    label: 'My Category',
    actions: [myNewAction]
  }
];
```

### Step 3: Register the Action

The action is automatically registered when added to a category, but you can also register it manually:

```typescript
actionRegistry.set('my-new-action', myNewAction);
```

## Action Configuration Options

### Basic Properties

- `key`: Unique identifier for the action
- `label`: Display name in the UI
- `category`: Category for organization

### UI Requirements

- `requiresComponentSelection`: Shows component dropdown for adding new components
- `requiresEditorComponentSelection`: Shows dropdown of existing components in editor
- `requiresInput`: Shows input field for user data
- `inputPlaceholder`: Placeholder text for input field
- `inputType`: Type of input ('text', 'number', 'textarea', 'json')

### Validation

- `validation`: Function that returns error message or null

### Execution

- `execute`: Async function that performs the actual action

## Example Actions

### Component Management
- **Add Component**: Places new components in the editor
- **Move Component**: Moves existing components
- **Delete Component**: Removes components from editor
- **Resize Component**: Changes component dimensions

### Component Configuration
- **Configure Component**: Updates component properties

### Layout
- **Change Layout**: Modifies the overall layout type

### Data
- **Bind Data**: Connects data sources to components

### Events
- **Add Event Handler**: Attaches event handlers to components

### Styling
- **Apply Style**: Applies CSS styles to components

## Input Types

### Text Input
```typescript
inputType: 'text'
```

### Number Input
```typescript
inputType: 'number'
```

### Textarea
```typescript
inputType: 'textarea'
```

### JSON Input
```typescript
inputType: 'json'
validation: (value: string) => {
  try {
    JSON.parse(value);
    return null;
  } catch {
    return 'Invalid JSON format';
  }
}
```

## Validation Examples

### Required Field
```typescript
validation: (value: string) => {
  if (!value.trim()) return 'This field is required';
  return null;
}
```

### Numeric Range
```typescript
validation: (value: string) => {
  const num = parseInt(value);
  if (isNaN(num) || num < 1 || num > 100) {
    return 'Please enter a number between 1 and 100';
  }
  return null;
}
```

### Custom Format
```typescript
validation: (value: string) => {
  const pattern = /^[A-Za-z0-9]+$/;
  if (!pattern.test(value)) {
    return 'Only alphanumeric characters are allowed';
  }
  return null;
}
```

## Best Practices

1. **Use Descriptive Keys**: Make action keys self-documenting
2. **Provide Clear Labels**: Use user-friendly action names
3. **Validate Input**: Always validate user input when required
4. **Handle Errors**: Provide meaningful error messages
5. **Show Feedback**: Use success/error messages to inform users
6. **Group Related Actions**: Use categories to organize actions logically

## Migration from Old System

The old hardcoded action handling has been replaced with the configuration-driven approach. All existing functionality is preserved, but now it's much easier to extend and maintain.

## Future Enhancements

- **Action History**: Track executed actions for undo/redo
- **Action Templates**: Predefined action configurations
- **Custom Validators**: Reusable validation functions
- **Action Dependencies**: Actions that depend on other actions
- **Batch Actions**: Execute multiple actions together 